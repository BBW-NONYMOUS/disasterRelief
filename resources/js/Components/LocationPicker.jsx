import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const PH_CENTER = [12.8797, 121.774];

// Captures map clicks and reports the coordinates upward.
function ClickCapture({ onPick }) {
    useMapEvents({
        click(e) { onPick(e.latlng.lat, e.latlng.lng); },
    });
    return null;
}

// Recenters the map when `target` changes (only on "use my location"),
// so it never fights the user's manual clicks.
function Recenter({ target, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (target) map.setView(target, zoom ?? 15);
    }, [target, zoom, map]);
    return null;
}

export default function LocationPicker({ latitude, longitude, onChange, height = 300 }) {
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState(null);
    const [recenter, setRecenter] = useState(null); // set only when locating

    const hasPoint = latitude != null && longitude != null && latitude !== '' && longitude !== '';
    const position = hasPoint ? [Number(latitude), Number(longitude)] : null;

    const pick = (lat, lng) => {
        setError(null);
        onChange({ latitude: Number(lat.toFixed(7)), longitude: Number(lng.toFixed(7)) });
    };

    const useMyLocation = () => {
        if (!navigator.geolocation) { setError('Geolocation is not supported by this browser.'); return; }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                pick(pos.coords.latitude, pos.coords.longitude);
                setRecenter([pos.coords.latitude, pos.coords.longitude]);
                setLocating(false);
            },
            () => { setError('Could not get your location. Tap the map to set it manually.'); setLocating(false); },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    {hasPoint
                        ? `Pinned at ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
                        : 'Tap the map to drop a pin on the affected location.'}
                </p>
                <div className="flex items-center gap-2">
                    {hasPoint && (
                        <button type="button" onClick={() => onChange({ latitude: null, longitude: null })}
                            className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                    )}
                    <button type="button" onClick={useMyLocation} disabled={locating}
                        className="text-xs font-medium text-primary hover:text-primary disabled:opacity-50">
                        {locating ? 'Locating…' : '📍 Use my location'}
                    </button>
                </div>
            </div>

            <div className="rounded-lg overflow-hidden border border-border" style={{ height }}>
                <MapContainer center={position ?? PH_CENTER} zoom={position ? 15 : 6} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ClickCapture onPick={pick} />
                    <Recenter target={recenter} zoom={15} />
                    {position && (
                        <CircleMarker center={position} radius={10}
                            pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.6, weight: 2 }} />
                    )}
                </MapContainer>
            </div>

            {error && <p className="text-xs text-status-rejected">{error}</p>}
        </div>
    );
}
