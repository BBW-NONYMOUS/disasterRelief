import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Navigation, X } from 'lucide-react';

// Free routing engine on OpenStreetMap data — no API key needed.
const OSRM = 'https://router.project-osrm.org/route/v1/driving';

function formatDistance(meters) {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds) {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${Math.max(1, mins)} min`;
    return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

// Center of the Philippines — sensible fallback when there are no markers yet.
const PH_CENTER = [12.8797, 121.774];

// Statuses that take a marker off the live map.
const CLOSED = ['resolved', 'rejected'];

// Marker colour reflects urgency: severity first, then report status.
// Colors follow the relief.md status tokens so pins, chips and legend agree.
function markerColor(r) {
    if (r.severity === 'critical' || r.severity === 'high') return '#C62828'; // status-rejected / emergency
    if (r.status === 'confirmed') return '#1565C0'; // primary
    if (r.status === 'verified') return '#1E88E5'; // status-verified
    if (r.severity === 'moderate') return '#F9A825'; // status-ongoing
    return '#757575'; // status-reported (new, unverified)
}

// Builds a pointed, clickable teardrop pin (no image assets — avoids the
// classic Leaflet+bundler broken-marker issue). Pulses when active/critical.
function pinIcon(r, pulse) {
    const color = markerColor(r);
    return L.divIcon({
        className: 'rn-pin-wrap',
        html: `
            <div class="rn-pin ${pulse ? 'rn-pulse' : ''}" style="color:${color}">
                <svg width="30" height="42" viewBox="0 0 28 40" aria-hidden="true">
                    <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="${color}"/>
                    <circle cx="14" cy="14" r="5" fill="#fff"/>
                </svg>
            </div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],   // tip sits exactly on the coordinate
        popupAnchor: [0, -38],
    });
}

// Short alert tone; a distinct two-note chime for critical events.
function playAlert(critical) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const beep = (freq, start, dur) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + dur);
        };
        if (critical) { beep(880, 0, 0.25); beep(1175, 0.28, 0.32); }
        else { beep(760, 0, 0.3); }
    } catch {}
}

// Pans/zooms to fit all current markers whenever they change.
function FitToMarkers({ points }) {
    const map = useMap();
    useEffect(() => {
        if (!points.length) return;
        if (points.length === 1) {
            map.setView([points[0].latitude, points[0].longitude], 14);
            return;
        }
        const bounds = points.map(p => [p.latitude, p.longitude]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }, [points, map]);
    return null;
}

export default function DisasterMap({ reports = [], barangayIds = [], statuses = null, height = 380 }) {
    // Statuses this viewer may see (e.g. donors: confirmed only); null = all active ones.
    const visible = (e) => !CLOSED.includes(e.status) && (!statuses || statuses.includes(e.status));

    // Keyed by report id so live events upsert cleanly.
    const [markers, setMarkers] = useState(() => indexById(reports));
    const [flash, setFlash] = useState({}); // id -> true while briefly highlighted
    const flashTimers = useRef({});
    const mapRef = useRef(null);

    // Routing: directions from the viewer's location to an incident (OSRM).
    const [route, setRoute] = useState(null);       // { coords, distance, duration, label }
    const [routing, setRouting] = useState(false);
    const [routeError, setRouteError] = useState(null);

    const locate = useCallback((onFound) => {
        if (!navigator.geolocation) {
            setRouteError('Location is not available on this device.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => onFound([coords.latitude, coords.longitude]),
            () => setRouteError('Allow location access to use directions.'),
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }, []);

    const locateMe = useCallback(() => {
        setRouteError(null);
        locate((pos) => {
            setRoute(r => (r ? { ...r, origin: pos } : { origin: pos }));
            mapRef.current?.setView(pos, 15);
        });
    }, [locate]);

    const getDirections = useCallback((report) => {
        setRouteError(null);
        setRouting(true);
        locate(async (origin) => {
            try {
                const url = `${OSRM}/${origin[1]},${origin[0]};${report.longitude},${report.latitude}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const json = await res.json();
                const best = json.routes?.[0];
                if (!best) throw new Error('no route');

                const coords = best.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                setRoute({
                    origin,
                    coords,
                    distance: best.distance,
                    duration: best.duration,
                    label: `${report.type} — ${report.affected_area}`,
                });
                mapRef.current?.fitBounds(coords, { padding: [50, 50] });
            } catch {
                setRouteError('No road route found — showing straight line instead.');
                setRoute({
                    origin,
                    coords: [origin, [Number(report.latitude), Number(report.longitude)]],
                    distance: null,
                    duration: null,
                    label: `${report.type} — ${report.affected_area}`,
                });
                mapRef.current?.fitBounds([origin, [Number(report.latitude), Number(report.longitude)]], { padding: [50, 50] });
            } finally {
                setRouting(false);
            }
        });
        // locate() failures surface via routeError; stop the spinner either way.
        setTimeout(() => setRouting(false), 11000);
    }, [locate]);

    const clearRoute = () => { setRoute(null); setRouteError(null); };

    // Keep in sync if the server re-sends props (e.g. Inertia partial reload).
    useEffect(() => { setMarkers(indexById(reports)); }, [reports]);

    // Live updates: subscribe to each barangay's public disaster feed.
    useEffect(() => {
        if (!window.Echo || !barangayIds.length) return;

        const channels = barangayIds.map(id => {
            const ch = window.Echo.channel(`disasters.barangay.${id}`);
            ch.listen('.disaster.changed', (e) => {
                setMarkers(prev => {
                    const next = { ...prev };
                    if (!visible(e) || e.latitude == null || e.longitude == null) {
                        delete next[e.id];
                    } else {
                        next[e.id] = e;
                    }
                    return next;
                });
                if (visible(e)) {
                    highlight(e.id);
                    playAlert(!!e.critical); // 🔔 audible alert on the map
                }
            });
            return id;
        });

        return () => channels.forEach(id => window.Echo.leave(`disasters.barangay.${id}`));
    }, [barangayIds.join(',')]);

    const highlight = (id) => {
        setFlash(f => ({ ...f, [id]: true }));
        clearTimeout(flashTimers.current[id]);
        flashTimers.current[id] = setTimeout(() => {
            setFlash(f => { const n = { ...f }; delete n[id]; return n; });
        }, 8000);
    };

    const points = useMemo(
        () => Object.values(markers).filter(r => r.latitude != null && r.longitude != null),
        [markers],
    );

    return (
        <div className="relative isolate rounded-xl overflow-hidden border border-border" style={{ height }}>
            <style>{PIN_CSS}</style>
            <MapContainer ref={mapRef} center={PH_CENTER} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors · routing by OSRM'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {!route && <FitToMarkers points={points} />}

                {/* Route from the viewer to the incident */}
                {route?.coords && (
                    <>
                        <Polyline positions={route.coords} pathOptions={{ color: '#0D47A1', weight: 7, opacity: 0.35 }} />
                        <Polyline positions={route.coords} pathOptions={{ color: '#1565C0', weight: 4, opacity: 0.95 }} />
                    </>
                )}
                {route?.origin && (
                    <CircleMarker
                        center={route.origin}
                        radius={7}
                        pathOptions={{ color: '#FFFFFF', weight: 2, fillColor: '#1565C0', fillOpacity: 1 }}
                    >
                        <Popup>You are here</Popup>
                    </CircleMarker>
                )}
                {points.map(r => {
                    const isCritical = r.severity === 'critical' || r.severity === 'high';
                    return (
                        <Marker
                            key={r.id}
                            position={[Number(r.latitude), Number(r.longitude)]}
                            icon={pinIcon(r, flash[r.id] || isCritical)}
                            zIndexOffset={flash[r.id] ? 1000 : isCritical ? 500 : 0}
                        >
                            <Popup>
                                <div className="text-sm">
                                    <div className="font-semibold">{r.type}</div>
                                    <div className="text-gray-600">{r.affected_area}</div>
                                    <div className="mt-1 capitalize text-xs text-gray-500">
                                        {r.severity ? `${r.severity} · ` : ''}{r.status}
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <a href={`/disaster-reports/${r.id}`} className="text-blue-600 hover:underline text-xs">
                                            View report →
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => getDirections(r)}
                                            disabled={routing}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
                                        >
                                            <Navigation className="h-3 w-3" aria-hidden="true" />
                                            {routing ? 'Routing…' : 'Directions here'}
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Locate-me control */}
            <button
                type="button"
                onClick={locateMe}
                aria-label="Show my location"
                title="Show my location"
                className="absolute right-3 top-3 z-[1000] rounded-md border border-border bg-card p-2 text-foreground shadow-sm transition-colors hover:bg-accent"
            >
                <LocateFixed className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Route summary panel */}
            {(route?.coords || routeError) && (
                <div className="absolute bottom-3 left-3 z-[1000] max-w-[calc(100%-1.5rem)] rounded-lg border border-border bg-card px-3 py-2 text-card-foreground shadow-md">
                    {route?.coords && (
                        <div className="flex items-center gap-3">
                            <Navigation className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            <div className="min-w-0 text-sm">
                                <div className="truncate font-medium capitalize">{route.label}</div>
                                <div className="text-xs text-muted-foreground">
                                    {route.distance != null
                                        ? <>{formatDistance(route.distance)} · about {formatDuration(route.duration)} by road</>
                                        : 'Straight-line path (no road route found)'}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={clearRoute}
                                aria-label="Clear route"
                                className="ml-1 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                    )}
                    {routeError && (
                        <p className="mt-1 text-xs text-status-ongoing" role="status">{routeError}</p>
                    )}
                </div>
            )}
        </div>
    );
}

const PIN_CSS = `
.rn-pin { position: relative; cursor: pointer; }
.rn-pin svg { display: block; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4)); transition: transform 0.15s ease; }
.rn-pin:hover svg { transform: scale(1.12); }
.rn-pin.rn-pulse::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    width: 16px;
    height: 16px;
    transform: translate(-50%, -100%);
    border-radius: 50%;
    background: currentColor;
    opacity: 0.6;
    animation: rn-pulse 1.6s ease-out infinite;
    z-index: -1;
}
@keyframes rn-pulse {
    0%   { transform: translate(-50%, -100%) scale(0.6); opacity: 0.7; }
    100% { transform: translate(-50%, -100%) scale(2.8); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
    .rn-pin.rn-pulse::before { animation: none; opacity: 0; }
}
`;

function indexById(list) {
    return (list || []).reduce((acc, r) => { acc[r.id] = r; return acc; }, {});
}
