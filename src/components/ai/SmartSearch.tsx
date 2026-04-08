'use client';
import { useState } from 'react';
import { Sparkles, X, Send, ChefHat } from 'lucide-react';

interface SmartSearchProps {
  onResults: (results: any[]) => void;
  onReset: () => void;
  hasResults?: boolean;
  location?: string;
}

export default function SmartSearch({ onResults, onReset, hasResults, location = 'Dhaka' }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const examples = [
    'Ingredients for a healthy breakfast',
    'Vegetables for biryani',
    'High protein foods',
    'Salad ingredients',
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSuggestion('');
    try {
      const res = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.products) onResults(data.products);
      if (data.suggestion) setSuggestion(data.suggestion);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Don't reset results on close — user can still see the AI filtered products
    // Only clear query and suggestion inside the modal
    setQuery('');
    setSuggestion('');
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-200 hover:shadow-lg ${hasResults ? 'ring-2 ring-violet-300' : ''}`}
      >
        <Sparkles size={15} />
        {hasResults ? 'AI Active' : 'AI Search'}
      </button>

      {/* Full Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">AI Smart Search</h3>
                  <p className="text-xs text-slate-400">Ask in plain language</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder={`Search for products in ${location}...`}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="flex-1 border-2 border-slate-200 focus:border-violet-400 rounded-xl px-4 py-3 text-sm outline-none transition-all"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-semibold transition-all hover:from-violet-600 hover:to-purple-700 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>

            {/* Examples */}
            <div className="flex flex-wrap gap-2 mb-4">
              {examples.map(ex => (
                <button
                  key={ex}
                  onClick={() => setQuery(ex)}
                  className="text-xs px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-full transition-all border border-violet-200"
                >
                  {ex}
                </button>
              ))}
            </div>

            {/* AI Suggestion Message */}
            {suggestion && (
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Sparkles size={14} className="text-violet-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-700 leading-relaxed">{suggestion}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
