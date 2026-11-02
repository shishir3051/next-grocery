'use client';

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    // Placeholder shown while Leaflet loads: same slate-100 surface as the map, brand spinner.
    <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-100" role="status">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" aria-hidden="true"></div>
        <span className="text-sm font-medium text-slate-600">Loading map…</span>
      </div>
    </div>
  ),
});

export default DynamicMap;
