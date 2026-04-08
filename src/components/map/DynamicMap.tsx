'use client';

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-0">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[#CC0000] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-500 font-bold text-sm tracking-widest uppercase">Loading Map Data...</span>
      </div>
    </div>
  ),
});

export default DynamicMap;
