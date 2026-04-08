'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

const customIcon = L.divIcon({
  className: 'custom-shwapno-pin',
  html: `
    <div style="width: 48px; height: 48px; background-color: #CC0000; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3); position: relative; top: -24px; left: -12px;">
       <div style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid white; display: flex; align-items: center; justify-content: center;">
         <span style="color: white; font-size: 10px; font-weight: bold;">PIN</span>
       </div>
       <div style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 12px solid #CC0000;"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

interface InteractiveMapProps {
  center: [number, number];
  onMarkerDragEnd: (lat: number, lng: number) => void;
}

export default function InteractiveMap({ center, onMarkerDragEnd }: InteractiveMapProps) {
  const [position, setPosition] = useState<[number, number]>(center);
  
  useEffect(() => {
    setPosition(center);
  }, [center]);

  const markerRef = useRef<L.Marker | null>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const { lat, lng } = marker.getLatLng();
        setPosition([lat, lng]);
        onMarkerDragEnd(lat, lng);
      }
    },
  };

  return (
    <div className="absolute inset-0 z-0 map-wrapper">
      <MapContainer 
        center={position} 
        zoom={16} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={position} />
        <Marker 
          position={position}
          icon={customIcon}
          draggable={true}
          eventHandlers={eventHandlers}
          ref={markerRef}
        />
      </MapContainer>
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container {
           filter: contrast(1.05) brightness(1.05) saturate(1.2);
           z-index: 1;
        }
      `}} />
    </div>
  );
}
