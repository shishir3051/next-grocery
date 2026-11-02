'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Search, Crosshair, X, ChevronDown, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import DynamicMap from '../map/DynamicMap';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const DISTRICTS = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Cumilla'];
const AREAS: Record<string, string[]> = {
  Dhaka: ['Banani', 'Gulshan', 'Dhanmondi', 'Uttara', 'Mirpur', 'Mohakhali'],
  Chittagong: ['Agrabad', 'Halishahar', 'Khulshi', 'Pahartali'],
};

const DHAKA_CENTER: [number, number] = [23.8103, 90.4125];
const QUERY_MIN = 2;
const QUERY_MAX = 120; // matches the /api/geocode limit

// Shared select styling (design-system input: rounded-lg, brand focus ring)
const SELECT_CLASS =
  'w-full cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-3 pr-10 text-base text-slate-900 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

/** One place, as normalised by /api/geocode (same shape for every provider). */
interface GeoResult {
  address: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
}

/** Feedback shown in the small line under the search bar. Never written into the input. */
interface StatusMessage {
  kind: 'info' | 'error';
  text: string;
  /** The lookup to repeat when the user presses "Try again". */
  retry?: RetryAction;
}

type RetryAction =
  | { type: 'search'; q: string }
  | { type: 'reverse'; lat: number; lng: number; source: 'pin' | 'gps' };

type GeocodeOutcome = { ok: true; results: GeoResult[] } | { ok: false; status: number };

const GENERIC_ERROR = "The address service didn't respond. Try again, or enter your area manually.";
const OFFLINE_ERROR = "Couldn't connect. Check your internet connection and try again.";
const RETRY_DELAY_MS = 800;

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>(resolve => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
  });

/**
 * Calls our geocode API, retrying once on a transient failure (dropped connection,
 * server restart, upstream hiccup) before reporting an error to the user.
 */
async function requestGeocode(params: Record<string, string>, signal: AbortSignal): Promise<GeocodeOutcome> {
  const first = await requestGeocodeOnce(params, signal);
  const transient = !first.ok && (first.status === 0 || first.status >= 500);
  if (!transient || signal.aborted) return first;
  await wait(RETRY_DELAY_MS, signal);
  if (signal.aborted) return first;
  return requestGeocodeOnce(params, signal);
}

/** One call to our geocode API; validates the response shape before trusting it. */
async function requestGeocodeOnce(params: Record<string, string>, signal: AbortSignal): Promise<GeocodeOutcome> {
  try {
    const res = await fetch(`/api/geocode?${new URLSearchParams(params)}`, { signal });
    if (!res.ok) return { ok: false, status: res.status };
    const data: unknown = await res.json();
    const list = typeof data === 'object' && data !== null && Array.isArray((data as { results?: unknown }).results)
      ? (data as { results: unknown[] }).results
      : [];
    const results = list.filter((r): r is GeoResult => {
      if (typeof r !== 'object' || r === null) return false;
      const p = r as Record<string, unknown>;
      return typeof p.address === 'string' && p.address.trim() !== '' &&
        typeof p.area === 'string' && typeof p.city === 'string' &&
        Number.isFinite(p.latitude) && Number.isFinite(p.longitude);
    });
    return { ok: true, results };
  } catch {
    return { ok: false, status: 0 }; // network error or aborted
  }
}

function errorMessageFor(status: number, type: 'search' | 'reverse'): string {
  if (status === 0) return OFFLINE_ERROR;
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status === 400) {
    return type === 'reverse'
      ? 'That spot is outside our delivery area. Please choose a location in Bangladesh.'
      : `Please type between ${QUERY_MIN} and ${QUERY_MAX} characters.`;
  }
  return GENERIC_ERROR;
}

/** "Gulshan, Dhaka" style secondary line (skips empty or repeated parts). */
function placeDetails(r: GeoResult): string {
  return [...new Set([r.area, r.city].filter(Boolean))].join(', ');
}

// True only in the browser (after hydration), so the portal can safely use document.body.
const subscribeNoop = () => () => {};
const useIsClient = () => useSyncExternalStore(subscribeNoop, () => true, () => false);

const looselyMatches = (a: string, b: string) => {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.includes(y) || y.includes(x);
};

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  onLocationChange: (loc: string) => void;
}

export default function LocationModal({ isOpen, onClose, currentLocation, onLocationChange }: LocationModalProps) {
  // Manual mode (dropdowns)
  const [district, setDistrict] = useState('Dhaka');
  const [area, setArea] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);

  // Map mode: the input text, the search results, the confirmed place and a status line
  // are kept apart so status text can never be saved as the user's address.
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [selected, setSelected] = useState<GeoResult | null>(null);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [busy, setBusy] = useState<'search' | 'locate' | 'reverse' | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DHAKA_CENTER);
  const mounted = useIsClient();

  // Only the latest lookup may update the UI: each new one aborts the previous.
  const lookupRef = useRef<AbortController | null>(null);

  // Cancel any in-flight lookup when the modal unmounts.
  useEffect(() => () => lookupRef.current?.abort(), []);

  // Reset to map mode each time the modal opens (adjusting state during render,
  // instead of in an effect, avoids an extra render).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setIsManualMode(false);
  }

  // Escape closes the (visible) results list first, then the modal
  const hasResults = results.length > 0;
  const resultsVisible = hasResults && !isManualMode;
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (resultsVisible) setResults([]);
      else onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, resultsVisible]);

  // Move keyboard focus into the dialog when it opens (it is portalled to the end of
  // <body>, so Tab would otherwise walk the whole page first) and give it back on close.
  const dialogRef = useRef<HTMLDivElement>(null);
  const isVisible = isOpen && mounted;
  useEffect(() => {
    if (!isVisible) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [isVisible]);

  const startLookup = useCallback(() => {
    lookupRef.current?.abort();
    const controller = new AbortController();
    lookupRef.current = controller;
    return controller;
  }, []);

  /** Pre-fills the manual-mode dropdowns from a found place, when it matches our list. */
  const prefillManual = useCallback((place: GeoResult) => {
    if (!place.city) return;
    const matchedDistrict = DISTRICTS.find(d => looselyMatches(place.city, d));
    if (!matchedDistrict) return;
    setDistrict(matchedDistrict);
    const matchedArea = place.area ? AREAS[matchedDistrict]?.find(a => looselyMatches(place.area, a)) : undefined;
    setArea(matchedArea ?? '');
  }, []);

  /** Finds the address for a point on the map (pin drag, map tap or GPS). */
  const reverseLookup = useCallback(async (lat: number, lng: number, source: 'pin' | 'gps') => {
    const controller = startLookup();
    setBusy(source === 'gps' ? 'locate' : 'reverse');
    setSelected(null); // the previous address no longer matches the pin
    setResults([]);
    setQuery(''); // an old search no longer describes the new pin; "Deliver to" shows the address
    setStatus({ kind: 'info', text: 'Finding address…' });

    const outcome = await requestGeocode(
      { type: 'reverse', lat: lat.toFixed(6), lng: lng.toFixed(6) },
      controller.signal
    );
    if (controller.signal.aborted) return;
    setBusy(null);

    if (!outcome.ok) {
      setStatus({
        kind: 'error',
        text: errorMessageFor(outcome.status, 'reverse'),
        retry: outcome.status === 400 ? undefined : { type: 'reverse', lat, lng, source },
      });
      return;
    }
    const place = outcome.results[0];
    if (!place) {
      setStatus({ kind: 'error', text: "We couldn't find an address here. Move the pin, search, or enter it manually." });
      return;
    }
    // Keep the exact point the user chose; the address is the nearest match to it.
    const chosen = { ...place, latitude: lat, longitude: lng };
    setSelected(chosen);
    prefillManual(chosen);
    setStatus(null);
  }, [startLookup, prefillManual]);

  // Stable identity so the map's marker handlers are not rebuilt on every render.
  const handleMapPick = useCallback((lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    void reverseLookup(lat, lng, 'pin');
  }, [reverseLookup]);

  if (!isOpen || !mounted) return null;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < QUERY_MIN) {
      setStatus({ kind: 'error', text: `Type at least ${QUERY_MIN} characters to search.` });
      return;
    }
    void runSearch(q);
  };

  const runSearch = async (q: string) => {
    const controller = startLookup();
    setBusy('search');
    setResults([]);
    setStatus({ kind: 'info', text: 'Searching…' });

    const outcome = await requestGeocode({ type: 'search', q }, controller.signal);
    if (controller.signal.aborted) return;
    setBusy(null);

    if (!outcome.ok) {
      setStatus({
        kind: 'error',
        text: errorMessageFor(outcome.status, 'search'),
        retry: outcome.status === 400 ? undefined : { type: 'search', q },
      });
    } else if (outcome.results.length === 0) {
      setStatus({ kind: 'info', text: 'No places found. Try a nearby landmark or area name.' });
    } else {
      setResults(outcome.results);
      setStatus(null);
    }
  };

  const handleRetry = (action: RetryAction) => {
    // The "Try again" button disappears when the status changes; keep focus in the dialog.
    dialogRef.current?.focus();
    if (action.type === 'search') void runSearch(action.q);
    else void reverseLookup(action.lat, action.lng, action.source);
  };

  const handlePickResult = (place: GeoResult) => {
    lookupRef.current?.abort();
    setBusy(null);
    setSelected(place);
    setQuery(place.address);
    setResults([]);
    setStatus(null);
    setMapCenter([place.latitude, place.longitude]);
    prefillManual(place);
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    // Only the search belongs to the input; a running pin/GPS lookup keeps its status line.
    if (busy === 'search') {
      lookupRef.current?.abort();
      setBusy(null);
    }
    if (busy === null || busy === 'search') setStatus(null);
  };

  const handleGeoLocation = () => {
    // Browsers only share location on https pages or localhost (not e.g. http://192.168.x.x).
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setStatus({ kind: 'error', text: "Your browser only shares your location on secure (https) pages. Search for your area or drop the pin on the map." });
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus({ kind: 'error', text: "Your browser can't share your location. Search for your area instead." });
      return;
    }
    // Reserve the lookup slot so a search started meanwhile cancels this GPS request.
    const controller = startLookup();
    setBusy('locate');
    setResults([]);
    setStatus({ kind: 'info', text: 'Getting your location…' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (controller.signal.aborted) return;
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        void reverseLookup(latitude, longitude, 'gps');
      },
      (error) => {
        if (controller.signal.aborted) return;
        setBusy(null);
        setStatus({
          kind: 'error',
          text: error.code === error.PERMISSION_DENIED
            ? 'Location access was blocked. Allow it in your browser settings, or search for your area.'
            : "Couldn't get your location. Search for your area or drop the pin on the map.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleConfirm = () => {
    if (!selected) return;
    onLocationChange(selected.address);
    onClose();
  };

  const handleManualDone = () => {
    onLocationChange(area ? `${area}, ${district}` : district);
    onClose();
  };

  const isBusy = busy !== null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        // outline-none: the dialog is only a programmatic focus target, not a control
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl outline-none"
        // min() keeps the modal inside short phone screens (min-height would otherwise win)
        style={{ minHeight: 'min(560px, 90vh)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="relative z-10 flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <h2 id="location-modal-title" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <MapPin size={20} className="text-brand-600" aria-hidden="true" />
            Delivery location
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative flex flex-1 flex-col bg-slate-50">
          {!isManualMode ? (
            // MAP MODE
            <div className="absolute inset-0 flex flex-col">
              <div className="relative flex-1">
                {/* Interactive map: drag the pin or tap the map to move it */}
                <DynamicMap center={mapCenter} onMarkerDragEnd={handleMapPick} />

                {/* Top search overlay */}
                <div className="absolute left-4 right-4 top-4 z-20">
                  <form
                    role="search"
                    onSubmit={handleSearch}
                    className="flex h-12 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-md transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20"
                  >
                    <div className="flex flex-1 items-center gap-2 pl-3">
                      <Search size={18} className="flex-shrink-0 text-slate-400" aria-hidden="true" />
                      {/* The container shows the focus ring, so the input's own outline is not needed */}
                      <input
                        type="text"
                        aria-label="Search delivery location"
                        placeholder="Search area, road or landmark"
                        value={query}
                        maxLength={QUERY_MAX}
                        enterKeyHint="search"
                        autoComplete="off"
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:outline-none"
                      />
                      {query && (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          aria-label="Clear search"
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 hover:text-slate-700"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {/* Use current location (GPS) */}
                    <button
                      type="button"
                      onClick={handleGeoLocation}
                      disabled={busy === 'locate'}
                      aria-label="Use my current location"
                      className="flex w-12 items-center justify-center bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:bg-brand-500"
                    >
                      <Crosshair size={20} className={busy === 'locate' ? 'animate-spin' : ''} aria-hidden="true" />
                    </button>
                  </form>

                  {/* Search results (picked explicitly, never auto-selected) */}
                  {hasResults && (
                    <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-md">
                      <p className="sr-only" role="status">
                        {results.length} {results.length === 1 ? 'place' : 'places'} found
                      </p>
                      <ul aria-label="Search results">
                        {results.map((place, i) => (
                          <li key={`${place.latitude},${place.longitude},${i}`}>
                            <button
                              type="button"
                              onClick={() => handlePickResult(place)}
                              className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50"
                            >
                              <MapPin size={16} className="mt-0.5 flex-shrink-0 text-slate-400" aria-hidden="true" />
                              <span className="min-w-0">
                                <span className="line-clamp-2 block text-sm font-medium text-slate-900">{place.address}</span>
                                {placeDetails(place) && (
                                  <span className="block truncate text-xs text-slate-500">{placeDetails(place)}</span>
                                )}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Status line: progress (polite) or errors (assertive) */}
                  {status && !hasResults && (
                    <p
                      // Remount when the kind changes: screen readers ignore a role switched on a live node
                      key={status.kind}
                      role={status.kind === 'error' ? 'alert' : 'status'}
                      className={cn(
                        'mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-medium shadow-sm',
                        status.kind === 'error'
                          ? 'border-danger-200 bg-danger-50 text-danger-700'
                          : 'border-slate-200 bg-white text-slate-700'
                      )}
                    >
                      {status.kind === 'error' ? (
                        <AlertCircle size={14} className="mt-px flex-shrink-0" aria-hidden="true" />
                      ) : isBusy ? (
                        <Loader2 size={14} className="mt-px flex-shrink-0 animate-spin" aria-hidden="true" />
                      ) : null}
                      <span className="flex-1">{status.text}</span>
                      {status.retry && (
                        <button
                          type="button"
                          onClick={() => status.retry && handleRetry(status.retry)}
                          className="-my-1 flex-shrink-0 rounded-md px-2 py-1 font-semibold text-danger-700 underline underline-offset-2 hover:bg-danger-100"
                        >
                          Try again
                        </button>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer: what will be saved, and the actions */}
              <div className="relative z-20 flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
                {selected ? (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <MapPin size={16} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Deliver to</p>
                      <p className="line-clamp-2 text-sm font-medium text-slate-900">{selected.address}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-600">Search, tap the map or drag the pin to choose where we deliver.</p>
                    {currentLocation && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        Current: <span className="font-medium text-slate-700">{currentLocation}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-3 flex gap-3">
                  <Button variant="secondary" onClick={() => setIsManualMode(true)}>
                    Enter manually
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={!selected || isBusy}
                    className="flex-1"
                  >
                    Confirm location
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // MANUAL MODE (dropdowns)
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-30 flex flex-1 flex-col bg-white p-6"
            >
              <h3 className="mb-1 text-base font-semibold text-slate-900">Select your area</h3>
              <p className="mb-5 text-sm text-slate-500">Choose your city and area for delivery.</p>

              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="location-city" className="mb-1.5 block text-sm font-medium text-slate-700">City</label>
                  <div className="relative">
                    <select
                      id="location-city"
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        setArea('');
                      }}
                      className={SELECT_CLASS}
                    >
                      <option value="" disabled>Select city</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  </div>
                </div>

                <div>
                  <label htmlFor="location-area" className="mb-1.5 block text-sm font-medium text-slate-700">Area</label>
                  <div className="relative">
                    <select
                      id="location-area"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      disabled={!district || !AREAS[district]}
                      className={SELECT_CLASS}
                    >
                      <option value="">Select area</option>
                      {district && AREAS[district]?.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                  </div>
                  {district && !AREAS[district] && (
                    <p className="mt-1.5 text-xs text-slate-500">Area selection isn&apos;t available for {district} yet.</p>
                  )}
                </div>
              </div>

              <div className="mt-auto flex gap-3 pt-6">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setIsManualMode(false)}
                  aria-label="Back to map"
                  className="w-1/3"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  Back
                </Button>
                <Button size="lg" onClick={handleManualDone} disabled={!district} className="w-2/3">
                  Done
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );

  // `mounted` guarantees we are in the browser, so document.body exists.
  return createPortal(modalContent, document.body);
}
