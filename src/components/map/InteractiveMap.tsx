'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

// Premium Shwapno-style custom pin
const customIcon = L.divIcon({
  className: 'custom-shwapno-pin',
  html: `
    <div style="width: 48px; height: 48px; background-color: #CC0000; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); position: relative; top: -24px; left: -12px;">
       <div style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center;">
         <span style="color: white; font-size: 10px; font-weight: bold; letter-spacing: 0.5px;">PIN</span>
       </div>
       <div style="position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 14px solid #CC0000;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 17, { animate: true });
  }, [center, map]);
  return null;
}

interface InteractiveMapProps {
  center: [number, number];
  onMarkerDragEnd: (lat: number, lng: number) => void;
}

export default function InteractiveMap({ center, onMarkerDragEnd }: InteractiveMapProps) {
  const [position, setPosition] = useState<[number, number]>(center);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    setPosition(center);
  }, [center]);

  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        setPosition([lat, lng]);
        onMarkerDragEnd(lat, lng);
      }
    },
  }), [onMarkerDragEnd]);

  return (
    <div className="absolute inset-0 z-0 map-wrapper">
      <MapContainer 
        center={position} 
        zoom={16} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        {/* Premium CartoDB Voyager Tiles (Cleaner than standard OSM) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater center={position} />
        <Marker 
          position={position}
          icon={customIcon}
          draggable={true}
          eventHandlers={eventHandlers}
          ref={markerRef}
        />
        <ZoomControl position="bottomright" />
      </MapContainer>
      
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container {
           background-color: #f8fafc;
           z-index: 1;
        }
        .leaflet-bar {
           border: none !important;
           box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
        }
        .leaflet-bar a {
           background-color: white !important;
           color: #64748b !important;
           border-bottom: 1px solid #f1f5f9 !important;
        }
      `}} />
    </div>
  );
}
