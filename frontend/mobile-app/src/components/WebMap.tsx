import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { UserLocation } from '@shared/userSlice';
import type { ThemeName } from '@shared/settingsSlice';
import {
  FULL_DETAIL_ZOOM,
  MapBounds,
  MapFocus,
  MapMarkerEntry,
  selectMapMarkers,
} from '@/lib/mapDisplay';
import { formatCuisine } from '@/lib/cuisineImages';
import { formatRating } from '@/lib/format';

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

const ACCENT: Record<ThemeName, string> = {
  dark: '#00f2fe',
  light: '#0891b2',
};

// "You are here" dot. Shown for any user location, whether it came from a real
// GPS fix or from manually picking a Manhattan neighbourhood — the map should
// always say where the results are being measured from.
function makeUserIcon(theme: ThemeName) {
  const color = ACCENT[theme];
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 18px; height: 18px; border-radius: 50%;
      background: ${color}; border: 3px solid #ffffff;
      box-shadow: 0 0 0 6px ${color}33, 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });
}

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

// Tab screens stay mounted when you switch away — they are only hidden with
// `display: none`, which drops this container to zero size. Leaflet still
// listens for window resizes, so it can re-measure against that empty box and
// pan the map pane by half a viewport; switching back then leaves the user dot
// shifted out of the (overflow-hidden) frame. Re-measure and restore the last
// view we recorded at a real size whenever the container has one again.
function ResizeGuard() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const isVisible = () => container.clientWidth > 0 && container.clientHeight > 0;

    // Only recorded while the container is really on screen: the move events
    // Leaflet fires off a zero-size re-measure carry a bogus centre.
    let lastView = { center: map.getCenter(), zoom: map.getZoom() };
    const remember = () => {
      if (isVisible()) lastView = { center: map.getCenter(), zoom: map.getZoom() };
    };
    map.on('moveend zoomend', remember);

    const observer = new ResizeObserver(() => {
      if (!isVisible()) return;
      map.invalidateSize();
      map.setView(lastView.center, lastView.zoom, { animate: false });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.off('moveend zoomend', remember);
    };
  }, [map]);

  return null;
}

// MapContainer's `center` only applies at mount, so a centre that lands later —
// an async GPS fix, or switching neighbourhood from the picker — has to be
// applied imperatively or the user marker ends up off screen.
function Recenter({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], Math.max(map.getZoom(), INITIAL_ZOOM));
  }, [map, latitude, longitude]);

  return null;
}

// Drives the camera from a tap on the parent's nearby list. Zooming to at
// least FULL_DETAIL_ZOOM guarantees the tapped venue is drawn individually
// instead of being culled into the zoomed-out overview subset.
function FocusOn({ focus }: { focus?: MapFocus | null }) {
  const map = useMap();
  const token = focus?.token;

  useEffect(() => {
    if (!focus) return;
    map.flyTo([focus.latitude, focus.longitude], Math.max(map.getZoom(), FULL_DETAIL_ZOOM), {
      duration: 0.6,
    });
    // Keyed on the token alone — re-running whenever `focus` changes identity
    // would drag the map back every time the parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return null;
}

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  restaurantsList: any[];
  busynessLabel: (score: number) => string;
  onViewDetails: (id: string) => void;
  theme: ThemeName;
  // The user's own position — GPS or a manually chosen neighbourhood. Null
  // while no location has been resolved, in which case no dot is drawn (the
  // map centre is then just the default fallback area, not the user).
  userLocation?: UserLocation | null;
  // Fires whenever the rendered marker set changes (pan/zoom/data), so the
  // parent can keep its list in sync with what the map actually shows.
  onVisibleRestaurantsChange?: (entries: MapMarkerEntry[]) => void;
  // Set by the parent when a row in the nearby list is tapped.
  focus?: MapFocus | null;
}

export default function LeafletMapContainer({
  latitude,
  longitude,
  restaurantsList,
  busynessLabel,
  onViewDetails,
  theme,
  userLocation,
  onVisibleRestaurantsChange,
  focus,
}: LeafletMapProps) {
  const [viewport, setViewport] = useState<{ bounds: MapBounds; zoom: number } | null>(null);
  const userIcon = useMemo(() => makeUserIcon(theme), [theme]);

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

        <ResizeGuard />

        <Recenter latitude={latitude} longitude={longitude} />

        <FocusOn focus={focus} />

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
            zIndexOffset={2000}
          >
            <Popup minWidth={120}>
              <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2px' }}>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
                  {userLocation.label ? `${userLocation.label}, Manhattan` : 'You are here'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  {userLocation.label
                    ? 'Browsing this area'
                    : `${userLocation.lat.toFixed(4)}°N, ${Math.abs(userLocation.lng).toFixed(4)}°W`}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

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
                  {formatCuisine(r.cuisine)} · {busynessLabel(r.busynessScore)}
                  {/* Nested block span rather than a sibling <p> so the 8px
                      gap above the button stays put when there's no rating. */}
                  {r.rating != null && (
                    <span style={{ display: 'block', marginTop: '2px', color: '#b45309', fontWeight: 600 }}>
                      {formatRating(r.rating, r.reviews)}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => onViewDetails(r.id)}
                  style={{
                    width: '100%',
                    backgroundColor: ACCENT[theme],
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
