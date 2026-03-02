import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_CAMERAS } from '../graphql/cameraQueries';
import { GET_DRONES } from '../graphql/droneQueries';
import { GET_SENSORS } from '../graphql/sensorQueries';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, Plane, Radio, Layers, Check } from 'lucide-react';
import HLSPlayer from '../components/HLSPlayer';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
// ─── Modern Glassmorphism Map Marker ─────────────────
function createMarker(icon, color, label, opts = {}) {
    const { size = 42, isOffline = false } = opts;
    const c = isOffline ? '#ef4444' : color;
    return L.divIcon({
        className: 'map-custom-icon',
        html: '<div class="sentinel-marker" style="--mc:' + c + ';--ms:' + size + 'px">' +
            '<div class="sentinel-pin">' +
            '<div class="sentinel-pin-icon">' + icon + '</div>' +
            '<span class="sentinel-pin-label">' + label + '</span>' +
            '<div class="sentinel-led ' + (isOffline ? 'off' : 'on') + '"></div>' +
            '</div>' +
            '<div class="sentinel-pointer"></div>' +
            '</div>',
        iconSize: [size + 20, size + 30],
        iconAnchor: [(size + 20) / 2, size + 30],
        popupAnchor: [0, -(size + 20)]
    });
}

// Drone-specific marker — just the icon, floating
function createDroneMarker(icon, color) {
    return L.divIcon({
        className: 'map-custom-icon',
        html: '<div class="sentinel-drone" style="--mc:' + color + '">' +
            '<div class="sentinel-drone-icon">' + icon + '</div>' +
            '<div class="sentinel-drone-shadow"></div>' +
            '</div>',
        iconSize: [36, 44],
        iconAnchor: [18, 22],
        popupAnchor: [0, -18]
    });
}

// Clean Lucide-style stroke icons
const svgCam = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="15" height="12" rx="2"/><path d="m17 9 5-3v12l-5-3"/></svg>';
const svgDrone = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>';
const svgSensor = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 16.24a6 6 0 0 1 0-8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/></svg>';
const svgOff = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>';

const cameraIcon = createMarker(svgCam, '#f5c542', 'CAM');
const droneIcon = createDroneMarker(svgDrone, '#a78bfa');
const sensorIcon = createMarker(svgSensor, '#10b981', 'IOT', { size: 34 });
const offlineIcon = createMarker(svgOff, '#ef4444', 'OFF', { size: 34, isOffline: true });

export default function MapView() {
    const { data: cData } = useQuery(GET_CAMERAS, { fetchPolicy: 'network-only' });
    const { data: dData } = useQuery(GET_DRONES);
    const { data: sData } = useQuery(GET_SENSORS);
    const [filters, setFilters] = useState({ cameras: true, drones: true, sensors: true });
    const [showFilters, setShowFilters] = useState(false);
    const [mapTheme, setMapTheme] = useState('dark');

    const themes = {
        dark: {
            url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
        },
        satellite: {
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
    };

    const cameras = cData?.cameras || [];
    const drones = dData?.drones || [];
    const sensors = sData?.sensors || [];
    const center = [-6.5971, 106.7908];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Map View</h1>
                    <p className="page-subtitle">Geographic overview of all surveillance assets</p>
                </div>
            </div>

            <div className="map-container">
                {/* Floating Map Controls */}
                <div className="map-filters-overlay">
                    <button
                        className={`map-control-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                        title="Map Layers"
                    >
                        <Layers size={20} />
                    </button>

                    {showFilters && (
                        <div className="map-filter-panel shadow-lg">
                            <div className="map-filter-section">
                                <span className="map-filter-label">Map Theme</span>
                                <div className="map-theme-grid">
                                    <button
                                        className={`map-theme-btn ${mapTheme === 'dark' ? 'active' : ''}`}
                                        onClick={() => setMapTheme('dark')}
                                    >
                                        <div style={{ width: '100%', height: '30px', background: '#0f172a', borderRadius: '4px', marginBottom: '4px' }}></div>
                                        <span>Dark</span>
                                    </button>
                                    <button
                                        className={`map-theme-btn ${mapTheme === 'satellite' ? 'active' : ''}`}
                                        onClick={() => setMapTheme('satellite')}
                                    >
                                        <div style={{ width: '100%', height: '30px', background: '#454a35', borderRadius: '4px', marginBottom: '4px' }}></div>
                                        <span>Satellite</span>
                                    </button>
                                </div>
                            </div>

                            <div className="map-divider"></div>

                            <div className="map-filter-section">
                                <span className="map-filter-label">Layers</span>
                                <div
                                    className={`map-filter-item ${filters.cameras ? 'active' : ''}`}
                                    onClick={() => setFilters(f => ({ ...f, cameras: !f.cameras }))}
                                >
                                    <div className="map-filter-item-icon">
                                        <Camera size={16} />
                                        <span>Cameras ({cameras.length})</span>
                                    </div>
                                    <div className="map-filter-check">
                                        {filters.cameras && <Check size={12} />}
                                    </div>
                                </div>

                                <div
                                    className={`map-filter-item ${filters.drones ? 'active' : ''}`}
                                    onClick={() => setFilters(f => ({ ...f, drones: !f.drones }))}
                                >
                                    <div className="map-filter-item-icon">
                                        <Plane size={16} />
                                        <span>Drones ({drones.length})</span>
                                    </div>
                                    <div className="map-filter-check">
                                        {filters.drones && <Check size={12} />}
                                    </div>
                                </div>

                                <div
                                    className={`map-filter-item ${filters.sensors ? 'active' : ''}`}
                                    onClick={() => setFilters(f => ({ ...f, sensors: !f.sensors }))}
                                >
                                    <div className="map-filter-item-icon">
                                        <Radio size={16} />
                                        <span>Sensors ({sensors.length})</span>
                                    </div>
                                    <div className="map-filter-check">
                                        {filters.sensors && <Check size={12} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}
                    zoomControl={true}>
                    <TileLayer
                        key={mapTheme}
                        attribution={themes[mapTheme].attribution}
                        url={themes[mapTheme].url}
                    />

                    {filters.cameras && cameras.map(cam => (
                        <Marker key={cam.id} position={[cam.coordinates.lat, cam.coordinates.lng]}
                            icon={cam.status === 'online' ? cameraIcon : offlineIcon}>
                            <Popup maxWidth={300}>
                                <div style={{ color: '#0a0e1a', fontSize: '13px', minWidth: cam.streamUrl ? '260px' : '180px' }}>
                                    {cam.streamUrl && (
                                        <div style={{ marginBottom: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                            <HLSPlayer url={cam.streamUrl} autoPlay={true} />
                                        </div>
                                    )}
                                    <strong>{cam.name}</strong><br />
                                    <span style={{ fontSize: '11px', color: '#666' }}>
                                        {cam.id} • {cam.type} • {cam.protocol}<br />
                                        Zone: {cam.zone}<br />
                                        Status: <span style={{ color: cam.status === 'online' ? '#10b981' : '#ef4444' }}>{cam.status}</span><br />
                                        Resolution: {cam.resolution}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {filters.drones && drones.map(drone => (
                        <Marker key={drone.id} position={[drone.coordinates.lat, drone.coordinates.lng]}
                            icon={droneIcon}>
                            <Popup>
                                <div style={{ color: '#0a0e1a', fontSize: '13px', minWidth: '180px' }}>
                                    <strong>{drone.name}</strong><br />
                                    <span style={{ fontSize: '11px', color: '#666' }}>
                                        {drone.id} • {drone.model}<br />
                                        Status: {drone.status}<br />
                                        Battery: {drone.battery}% • Alt: {drone.altitude}m<br />
                                        Zone: {drone.assignedZone}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {filters.sensors && sensors.map(sensor => (
                        <Marker key={sensor.id} position={[sensor.coordinates.lat, sensor.coordinates.lng]}
                            icon={sensor.isAboveThreshold ? offlineIcon : sensorIcon}>
                            <Popup>
                                <div style={{ color: '#0a0e1a', fontSize: '13px', minWidth: '180px' }}>
                                    <strong>{sensor.name}</strong><br />
                                    <span style={{ fontSize: '11px', color: '#666' }}>
                                        {sensor.id} • {sensor.type}<br />
                                        Value: <strong>{sensor.value} {sensor.unit}</strong><br />
                                        Threshold: {sensor.threshold} {sensor.unit}<br />
                                        Status: {sensor.status}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
