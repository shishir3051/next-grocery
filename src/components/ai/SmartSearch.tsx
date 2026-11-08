'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Sparkles, X, Search, AlertCircle, Info } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface SmartSearchProps {
  /**
   * Products found (serialised product documents); an empty array means "nothing matched".
   * `query` is the text that was searched, so the page can show what the results are for.
   */
  onResults: (results: unknown[], query: string) => void;
  onReset: () => void;
  hasResults?: boolean;
  location?: string;
}

/** Shape of a successful POST /api/ai/smart-search reply. */
interface SearchReply {
  products?: unknown;
  suggestion?: unknown;
  mode?: unknown;
  error?: unknown;
}

interface SearchResult {
  count: number;
  suggestion: string;
  mode: 'ai' | 'keyword';
}

// Keep in sync with the API route's validation.
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 200;
// Long enough to read "N products found", short enough to feel instant.
const AUTO_CLOSE_DELAY_MS = 1200;
const GENERIC_ERROR = 'Search is unavailable right now. Please try again.';

const EXAMPLES = [
  'Ingredients for a healthy breakfast',
  'Vegetables for biryani',
  'High protein foods',
  'Salad ingredients',
];

export default function SmartSearch({ onResults, onReset, hasResults, location = 'Dhaka' }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The element that opened the dialog, so focus can go back to it on close (keyboard users).
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const inputId = useId();

  const canSearch = query.trim().length >= MIN_QUERY_LENGTH && !loading;

  const cancelAutoClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  // Stops any running request and pending auto-close (refs + stable setters only, so no deps).
  const closeDialog = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    setLoading(false);
    setError('');
    setIsOpen(false);
    returnFocusRef.current?.focus();
    returnFocusRef.current = null;
  }, []);

  const openDialog = () => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // The last search stays visible while its results are on the page; otherwise start fresh.
    if (!hasResults) {
      setQuery('');
      setResult(null);
    }
    setError('');
    setIsOpen(true);
  };

  const runSearch = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length < MIN_QUERY_LENGTH || loading) return;

    cancelAutoClose();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
        signal: controller.signal,
      });
      const data: SearchReply = await res.json().catch(() => ({}));
      // An abort while the body is read is swallowed by the catch above, so check explicitly:
      // otherwise a closed dialog or a newer search would still receive an empty result.
      if (controller.signal.aborted) return;

      if (!res.ok) {
        // The API only sends short, user-safe messages (incl. the 429 "please wait" one).
        setError(typeof data.error === 'string' && data.error ? data.error : GENERIC_ERROR);
        return;
      }

      const products = Array.isArray(data.products) ? data.products : [];
      onResults(products, trimmed); // [] lets the home page show its "no products" state
      setResult({
        count: products.length,
        suggestion: typeof data.suggestion === 'string' ? data.suggestion : '',
        mode: data.mode === 'keyword' ? 'keyword' : 'ai',
      });

      // Close so the user sees the grid; keep the dialog open on no results so the hint stays readable.
      if (products.length > 0) {
        closeTimerRef.current = setTimeout(closeDialog, AUTO_CLOSE_DELAY_MS);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return; // dialog closed / new search
      setError(GENERIC_ERROR);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  };

  const handleExample = (example: string) => {
    setQuery(example);
    void runSearch(example);
  };

  const handleClearResults = () => {
    cancelAutoClose();
    onReset();
    setResult(null);
    setQuery('');
    inputRef.current?.focus();
  };

  // Focus the input when the dialog opens, and let Escape close it
  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDialog();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeDialog]);

  // Don't leave a request or timer running after the component unmounts.
  useEffect(() => () => {
    abortRef.current?.abort();
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  return (
    <>
      {/* Toggle Button: same neutral style as "Recipes" so the toolbar reads as one set */}
      <Button
        variant="secondary"
        onClick={openDialog}
        aria-haspopup="dialog"
        className={cn(hasResults && 'border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 hover:border-brand-400')}
      >
        <Sparkles size={16} className="text-brand-600" aria-hidden="true" />
        {hasResults ? 'AI search on' : 'AI search'}
      </Button>

      {/* Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 px-4 pt-24 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDialog();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600" aria-hidden="true">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 id={titleId} className="text-base font-semibold text-slate-900">AI smart search</h2>
                  <p className="text-sm text-slate-500">Ask in plain language, English or Bangla</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Close AI search"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Input */}
            <label htmlFor={inputId} className="sr-only">Describe what you need</label>
            <div className="mb-4 flex gap-2">
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                enterKeyHint="search"
                autoComplete="off"
                placeholder={`Search for products in ${location}...`}
                value={query}
                maxLength={MAX_QUERY_LENGTH}
                onChange={e => {
                  cancelAutoClose();
                  setQuery(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={e => {
                  // Ignore the Enter that confirms an IME composition (e.g. Bangla keyboards).
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) void runSearch(query);
                }}
                className="h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <Button onClick={() => runSearch(query)} loading={loading} disabled={!canSearch} aria-label="Search">
                {!loading && <Search size={18} aria-hidden="true" />}
              </Button>
            </div>

            {/* Examples: one click runs the search */}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Try</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => handleExample(ex)}
                  disabled={loading}
                  className="min-h-10 rounded-full border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>

            {/* Error (non-OK reply, rate limit, network) */}
            {error && (
              <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 p-4">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-danger-600" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-danger-700">{error}</p>
              </div>
            )}

            {/* Status + AI suggestion */}
            <div aria-live="polite" className="space-y-3">
              {loading && <p className="text-sm text-slate-500">Searching…</p>}
              {result && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {result.count === 0
                        ? 'No products found'
                        : `${result.count} ${result.count === 1 ? 'product' : 'products'} found`}
                    </p>
                    {hasResults && (
                      <Button variant="ghost" size="sm" onClick={handleClearResults}>
                        Clear results
                      </Button>
                    )}
                  </div>
                  {result.suggestion && (
                    <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50 p-4">
                      <Sparkles size={16} className="mt-0.5 flex-shrink-0 text-brand-600" aria-hidden="true" />
                      <p className="text-sm leading-relaxed text-slate-700">{result.suggestion}</p>
                    </div>
                  )}
                  {result.mode === 'keyword' && (
                    <p className="flex items-start gap-1.5 text-xs text-slate-500">
                      <Info size={14} className="mt-px flex-shrink-0" aria-hidden="true" />
                      AI suggestions weren&apos;t available for this search, so results are based on the words you typed.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
