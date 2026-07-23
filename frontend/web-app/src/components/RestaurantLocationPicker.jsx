import { useCallback, useState } from 'react';
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { isValidLatitude, isValidLongitude } from '../utils/validation';
import { useGetMapsConfigQuery } from '../../../packages/shared/src/apiSlice.ts';

const LIBRARIES = ['places'];
const MAP_CONTAINER_STYLE = { width: '100%', height: '260px', borderRadius: '0.75rem' };
// Manhattan — matches the seed data's coverage area, used whenever no
// location has been picked yet so the map opens somewhere relevant.
const DEFAULT_CENTER = { lat: 40.7589, lng: -73.9851 };

function formatCoord(value) {
  return Number(value).toFixed(6);
}

// Manual lat/lng fields, shown whenever the interactive map itself can't run
// (key not fetched yet, pending backend, or a load failure) so onboarding is
// never fully blocked on it.
function ManualCoordinateFallback({ latitude, longitude, onChange, disabled }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="latitude" className="block text-[11px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5 font-bold">
          Latitude
        </label>
        <input
          id="latitude"
          type="number"
          step="any"
          value={latitude}
          onChange={(e) => onChange({ latitude: e.target.value, longitude })}
          placeholder="40.7589"
          disabled={disabled}
          className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-3 text-sm text-table-text placeholder-table-textSubtle focus:outline-none focus:border-table-primary transition-colors"
        />
      </div>
      <div>
        <label htmlFor="longitude" className="block text-[11px] font-mono text-table-textMuted uppercase tracking-wide mb-1.5 font-bold">
          Longitude
        </label>
        <input
          id="longitude"
          type="number"
          step="any"
          value={longitude}
          onChange={(e) => onChange({ latitude, longitude: e.target.value })}
          placeholder="-73.9851"
          disabled={disabled}
          className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-3 text-sm text-table-text placeholder-table-textSubtle focus:outline-none focus:border-table-primary transition-colors"
        />
      </div>
    </div>
  );
}

// Only mounted once a real key has been fetched — this is the sole thing in
// this file that touches @react-google-maps/api's hooks, so the (browser-
// only, script-injecting) Maps loader is never invoked before a key exists,
// in tests or otherwise.
function GoogleMapPicker({ apiKey, latitude, longitude, onChange, disabled }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });
  const [autocomplete, setAutocomplete] = useState(null);

  const hasPickedLocation = isValidLatitude(latitude) && isValidLongitude(longitude);
  const position = hasPickedLocation
    ? { lat: Number(latitude), lng: Number(longitude) }
    : DEFAULT_CENTER;

  const handleMapClick = useCallback(
    (e) => {
      onChange({ latitude: formatCoord(e.latLng.lat()), longitude: formatCoord(e.latLng.lng()) });
    },
    [onChange]
  );

  const handleMarkerDragEnd = useCallback(
    (e) => {
      onChange({ latitude: formatCoord(e.latLng.lat()), longitude: formatCoord(e.latLng.lng()) });
    },
    [onChange]
  );

  const handlePlaceChanged = () => {
    const place = autocomplete?.getPlace();
    const loc = place?.geometry?.location;
    if (loc) {
      onChange({ latitude: formatCoord(loc.lat()), longitude: formatCoord(loc.lng()) });
    }
  };

  if (loadError) {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-xs font-mono text-table-danger bg-table-danger/10 border border-table-danger/30 rounded-xl p-3">
          Map failed to load. Enter coordinates manually below.
        </p>
        <ManualCoordinateFallback latitude={latitude} longitude={longitude} onChange={onChange} disabled={disabled} />
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[260px] flex items-center justify-center bg-table-canvas border border-table-border rounded-xl">
        <p className="text-xs font-mono text-table-textSubtle">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlaceChanged}>
        <input
          type="text"
          placeholder="Search for your restaurant's address..."
          disabled={disabled}
          className="w-full bg-table-canvas border border-table-border rounded-xl px-4 py-3 text-sm text-table-text placeholder-table-textSubtle focus:outline-none focus:border-table-primary transition-colors"
        />
      </Autocomplete>

      <GoogleMap mapContainerStyle={MAP_CONTAINER_STYLE} center={position} zoom={hasPickedLocation ? 16 : 12} onClick={disabled ? undefined : handleMapClick}>
        <Marker position={position} draggable={!disabled} onDragEnd={handleMarkerDragEnd} />
      </GoogleMap>

      <p className="text-[11px] font-mono text-table-textSubtle">
        {hasPickedLocation
          ? `Pinned at ${formatCoord(latitude)}, ${formatCoord(longitude)}`
          : 'Search an address or click the map to drop a pin.'}
      </p>
    </div>
  );
}

export default function RestaurantLocationPicker({ latitude, longitude, onChange, disabled }) {
  const { data, isLoading, isError } = useGetMapsConfigQuery();

  if (isLoading) {
    return (
      <div className="h-[260px] flex items-center justify-center bg-table-canvas border border-table-border rounded-xl">
        <p className="text-xs font-mono text-table-textSubtle">Loading map...</p>
      </div>
    );
  }

  if (isError || !data?.apiKey) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-mono text-table-textSubtle bg-table-canvas border border-table-border rounded-xl p-3">
          Map picker unavailable right now. Enter coordinates manually for now.
        </p>
        <ManualCoordinateFallback latitude={latitude} longitude={longitude} onChange={onChange} disabled={disabled} />
      </div>
    );
  }

  return <GoogleMapPicker apiKey={data.apiKey} latitude={latitude} longitude={longitude} onChange={onChange} disabled={disabled} />;
}
