'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

// Free OpenStreetMap tiles by default (no key needed). A keyed provider can be dropped in
// later via NEXT_PUBLIC_MAP_TILE_URL / NEXT_PUBLIC_MAP_TILE_ATTRIBUTION (both are public:
// tile URLs are visible in the browser anyway, so only use provider keys meant for that).
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TILE_MAX_ZOOM = 19;
const FOCUS_ZOOM = 16;

// Brand-coloured teardrop pin, drawn as a 40x52 SVG whose tip is at the bottom centre.
// iconAnchor [20, 52] puts that tip exactly on the chosen coordinate. Leaflet renders this
// HTML string outside React/Tailwind, so the colour is the theme's CSS variable with a
// literal fallback that mirrors the brand-600 token (#0f766e).
const PIN_WIDTH = 40;
const PIN_HEIGHT = 52;
const pinIcon = L.divIcon({
  className: 'fb-map-pin',
  html: `
    <svg width="${PIN_WIDTH}" height="${PIN_HEIGHT}" viewBox="0 0 ${PIN_WIDTH} ${PIN_HEIGHT}" aria-hidden="true" focusable="false">
      <path d="M20 50.5C20 50.5 3 33.5 3 19.5a17 17 0 0 1 34 0C37 33.5 20 50.5 20 50.5Z"
        style="fill: var(--color-brand-600, #0f766e); stroke: #fff; stroke-width: 3; stroke-linejoin: round;" />
      <circle cx="20" cy="19.5" r="6.5" fill="#fff" />
    </svg>
  `,
  iconSize: [PIN_WIDTH, PIN_HEIGHT],
  iconAnchor: [PIN_WIDTH / 2, PIN_HEIGHT],
});

/**
 * Re-centres the map when the `center` prop changes. Depends on the two numbers rather than
 * the array, so a new array with the same values (every parent render) does not re-pan.
 */
function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    // Zoom in to street level if needed, but never zoom out a user who is already closer.
    map.setView([lat, lng], Math.max(map.getZoom(), FOCUS_ZOOM), { animate: true });
  }, [lat, lng, map]);
  return null;
}

/** Tapping/clicking the map moves the pin there (same handler as dragging the pin). */
function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface InteractiveMapProps {
  center: [number, number];
  /** Called when the user drags the pin or taps the map. */
  onMarkerDragEnd: (lat: number, lng: number) => void;
}

export default function InteractiveMap({ center, onMarkerDragEnd }: InteractiveMapProps) {
  const [centerLat, centerLng] = center;
  const [position, setPosition] = useState<[number, number]>(center);
  const [syncedCenter, setSyncedCenter] = useState<[number, number]>(center);
  const markerRef = useRef<L.Marker | null>(null);

  // Follow the parent's center when its numbers change (React's "adjust state while
  // rendering" pattern, which avoids an extra effect + render).
  if (syncedCenter[0] !== centerLat || syncedCenter[1] !== centerLng) {
    setSyncedCenter([centerLat, centerLng]);
    setPosition([centerLat, centerLng]);
  }

  const eventHandlers = useMemo(() => ({
    // Clicking (or pressing Enter on) the pin itself must not count as a map tap: without a
    // marker click listener Leaflet hands the click to the map, which would move the pin to
    // the clicked point on the icon (above the real coordinate). Markers don't bubble mouse
    // events, so this no-op listener keeps the click on the marker.
    click() {},
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        setPosition([lat, lng]);
        onMarkerDragEnd(lat, lng);
      }
    },
  }), [onMarkerDragEnd]);

  const handleMapPick = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
    onMarkerDragEnd(lat, lng);
  }, [onMarkerDragEnd]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden map-wrapper">
      <MapContainer
        center={position}
        zoom={FOCUS_ZOOM}
        maxZoom={TILE_MAX_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} maxZoom={TILE_MAX_ZOOM} />
        <MapUpdater lat={centerLat} lng={centerLng} />
        <MapClickHandler onPick={handleMapPick} />
        <Marker
          position={position}
          icon={pinIcon}
          draggable={true}
          title="Delivery location. Drag to adjust."
          eventHandlers={eventHandlers}
          ref={markerRef}
        />
        <ZoomControl position="bottomright" />
      </MapContainer>

      {/* Leaflet controls live outside Tailwind, so they use the theme's CSS variables
          (literal fallbacks mirror the slate-50/100/200/600/900 tokens). The zoom buttons
          are 40px touch targets in a rounded-xl (12px) card with a shadow-md-like shadow. */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container {
           background-color: var(--color-slate-100, #f1f5f9);
           font-family: inherit;
           z-index: 1;
           /* Tap/click places the pin (Leaflet still shows "grabbing" while panning) */
           cursor: crosshair;
        }
        .fb-map-pin {
           background: none;
           border: none;
           filter: drop-shadow(0 3px 4px rgba(15,23,42,0.3));
        }
        .fb-map-pin svg {
           display: block;
        }
        .leaflet-control-attribution {
           font-size: 12px;
        }
        .leaflet-bar {
           border: 1px solid var(--color-slate-200, #e2e8f0) !important;
           border-radius: 12px !important;
           overflow: hidden;
           box-shadow: 0 4px 6px -1px rgba(15,23,42,0.1), 0 2px 4px -2px rgba(15,23,42,0.1) !important;
        }
        .leaflet-bar a {
           width: 40px !important;
           height: 40px !important;
           line-height: 40px !important;
           font-size: 20px !important;
           background-color: white !important;
           color: var(--color-slate-600, #475569) !important;
           border-bottom: 1px solid var(--color-slate-200, #e2e8f0) !important;
        }
        .leaflet-bar a:last-child {
           border-bottom: none !important;
        }
        .leaflet-bar a:focus-visible {
           /* The bar clips overflow (for its rounded corners), so draw the focus ring inside */
           outline-offset: -3px;
        }
        .leaflet-bar a:hover {
           color: var(--color-slate-900, #0f172a) !important;
           background-color: var(--color-slate-50, #f8fafc) !important;
        }
      `}} />
    </div>
  );
}
