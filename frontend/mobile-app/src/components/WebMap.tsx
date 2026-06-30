import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons breaking in web bundlers
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  restaurantsList: any[];
  busynessLabel: (score: number) => string;
  onViewDetails: (id: string) => void;
}

export default function LeafletMapContainer({
  latitude,
  longitude,
  restaurantsList,
  busynessLabel,
  onViewDetails,
}: LeafletMapProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer 
        center={[latitude, longitude]} 
        zoom={14} 
        zoomControl={false} 
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {restaurantsList.map((r) => (
          <Marker key={r.id} position={[r.latitude, r.longitude]}>
            <Popup minWidth={160}>
              <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
                  {r.name}
                </h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#64748b' }}>
                  {r.cuisine} · {busynessLabel(r.busynessScore)}
                </p>
                <button
                  onClick={() => onViewDetails(r.id)}
                  style={{
                    width: '100%',
                    backgroundColor: '#00f2fe',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#0f172a',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '6px 0',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}