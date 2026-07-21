import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { ThemeName } from '@shared/settingsSlice';
import {
  FULL_DETAIL_ZOOM,
  MapBounds,
  MapMarkerEntry,
  selectMapMarkers,
} from '@/lib/mapDisplay';

// Fix for default Leaflet marker icons breaking in web bundlers
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const INITIAL_ZOOM = 14;

// CARTO basemaps give us matching light/dark styles; OSM only ships light.
const TILE_LAYERS: Record<ThemeName, { url: string; attribution: string }> = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
};

const POPUP_ACCENT: Record<ThemeName, string> = {
  dark: '#00f2fe',
  light: '#0891b2',
};

// Gold badge for the top picks so they stand out from the default pins.
const highlightIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 30px; height: 30px; border-radius: 50%;
    background: #f5b014; border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; line-height: 1;
  ">★</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -16],
});

function toBounds(b: L.LatLngBounds): MapBounds {
  return {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  };
}

// Child of MapContainer so it can hook leaflet events; reports the current
// extent + zoom back up whenever the user pans or zooms.
function ViewportTracker({
  onChange,
}: {
  onChange: (bounds: MapBounds, zoom: number) => void;
}) {
  const map = useMapEvents({
    moveend: () => onChange(toBounds(map.getBounds()), map.getZoom()),
    zoomend: () => onChange(toBounds(map.getBounds()), map.getZoom()),
  });

  useEffect(() => {
    onChange(toBounds(map.getBounds()), map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  restaurantsList: any[];
  busynessLabel: (score: number) => string;
  onViewDetails: (id: string) => void;
  theme: ThemeName;
  // Fires whenever the rendered marker set changes (pan/zoom/data), so the
  // parent can keep its list in sync with what the map actually shows.
  onVisibleRestaurantsChange?: (entries: MapMarkerEntry[]) => void;
}

export default function LeafletMapContainer({
  latitude,
  longitude,
  restaurantsList,
  busynessLabel,
  onViewDetails,
  theme,
  onVisibleRestaurantsChange,
}: LeafletMapProps) {
  const [viewport, setViewport] = useState<{ bounds: MapBounds; zoom: number } | null>(null);

  // Pure client-side selection over the cached restaurant list — panning and
  // zooming never trigger new backend requests.
  const markers = useMemo(
    () =>
      selectMapMarkers(
        restaurantsList,
        viewport?.bounds ?? null,
        viewport?.zoom ?? INITIAL_ZOOM
      ),
    [restaurantsList, viewport]
  );

  useEffect(() => {
    onVisibleRestaurantsChange?.(markers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  const tiles = TILE_LAYERS[theme];
  const zoomedOut = (viewport?.zoom ?? INITIAL_ZOOM) < FULL_DETAIL_ZOOM;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={INITIAL_ZOOM}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Keyed by theme so the layer reloads when light mode is toggled */}
        <TileLayer key={theme} attribution={tiles.attribution} url={tiles.url} />

        <ViewportTracker
          onChange={(bounds, zoom) => setViewport({ bounds, zoom })}
        />

        {markers.map(({ restaurant: r, highlighted }) => (
          <Marker
            key={r.id}
            position={[r.latitude, r.longitude]}
            {...(highlighted ? { icon: highlightIcon, zIndexOffset: 1000 } : {})}
          >
            <Popup minWidth={160}>
              <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
                  {highlighted ? '★ ' : ''}{r.name}
                </h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#64748b' }}>
                  {r.cuisine} · {busynessLabel(r.busynessScore)}
                </p>
                <button
                  onClick={() => onViewDetails(r.id)}
                  style={{
                    width: '100%',
                    backgroundColor: POPUP_ACCENT[theme],
                    border: 'none',
                    borderRadius: '6px',
                    color: theme === 'dark' ? '#0f172a' : '#ffffff',
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

      {/* Hint that more spots appear as you zoom in */}
      {zoomedOut && restaurantsList.length > markers.length && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: theme === 'dark' ? 'rgba(9,9,11,0.85)' : 'rgba(255,255,255,0.9)',
            color: theme === 'dark' ? '#fbf7f2' : '#1c1917',
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '4px 10px',
            borderRadius: '999px',
            pointerEvents: 'none',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          TOP PICKS · ZOOM IN FOR MORE
        </div>
      )}
    </div>
  );
}
