import React, { useEffect, useRef } from 'react';

const getL = () => (typeof window !== 'undefined' ? window.L : null);

export default function MapCanvasWrapper({ children, center, zoom, onMarkerSelect }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!getL() && !document.getElementById('leaflet-script')) {
      const script = document.createElement('script');
      script.id = 'leaflet-script';
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => initMap();
      document.body.appendChild(script);
    } else if (getL()) {
      initMap();
    }

    function initMap() {
      const L = getL();
      if (!L || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([center.lat, center.lng], zoom);

      // Using the official dark_all engine which provides the clean, detailed black base
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = getL();
    if (!L || !markersLayerRef.current || !React.isValidElement(children)) return;

    markersLayerRef.current.clearLayers();
    const childrenArray = React.Children.toArray(children);

    childrenArray.forEach((child) => {
      if (!child.props) return;
      const { lat, lng, customerData, isActive } = child.props;

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; animation: ping 1.5s infinite; opacity: 0.6; background-color: ${isActive ? '#fbbf24' : '#34d399'};"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; border: 2px solid #000; background-color: ${isActive ? '#fbbf24' : '#34d399'}; box-shadow: 0 0 12px ${isActive ? '#fbbf24' : '#34d399'};"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });
      
      marker.on('click', () => {
        if (onMarkerSelect) onMarkerSelect(customerData);
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [children, onMarkerSelect]);

  return (
    <div className="w-full h-full min-h-[550px] relative rounded-2xl overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-10 bg-[#0A0A0A] clean-contrast-map" />
      
      <style>{`
        @keyframes ping {
          0% { transform: scale(0.2); opacity: 0.9; }
          80%, 100% { transform: scale(2.2); opacity: 0; }
        }
        
        /* This brightens the thin vector lines and text labels significantly,
          allowing them to pop cleanly without changing the deep black background colors.
        */
        .clean-contrast-map .leaflet-tile-pane {
          filter: brightness(1.75) contrast(1.2);
        }

        .leaflet-container {
          background: #0A0A0A !important;
        }
        
        .leaflet-control-zoom a {
          background-color: #1A1A1E !important;
          color: #ffffff !important;
          border: 1px solid #3f3f46 !important;
          border-radius: 8px !important;
          margin-bottom: 4px;
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}

export function MapMarker() {
  return null; 
}