import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Center of the Philippines — sensible fallback when there are no markers yet.
const PH_CENTER = [12.8797, 121.774];

// Marker colour reflects urgency: severity first, then report status.
function markerColor(r) {
    if (r.severity === 'critical' || r.severity === 'high') return '#dc2626'; // red
    if (r.status === 'confirmed') return '#2563eb'; // blue
    if (r.severity === 'moderate') return '#d97706'; // amber
    return '#eab308'; // yellow (reported / low)
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

export default function DisasterMap({ reports = [], barangayIds = [], height = 380 }) {
    // Keyed by report id so live events upsert cleanly.
    const [markers, setMarkers] = useState(() => indexById(reports));
    const [flash, setFlash] = useState({}); // id -> true while briefly highlighted
    const flashTimers = useRef({});

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
                    if (e.status === 'resolved' || e.latitude == null || e.longitude == null) {
                        delete next[e.id];
                    } else {
                        next[e.id] = e;
                    }
                    return next;
                });
                if (e.status !== 'resolved') {
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
        <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height }}>
            <style>{PIN_CSS}</style>
            <MapContainer center={PH_CENTER} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitToMarkers points={points} />
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
                                    <a href={`/disaster-reports/${r.id}`} className="text-blue-600 hover:underline text-xs">
                                        View report →
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
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
