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

function createIcon(color, size = 12) {
    return L.divIcon({
        className: '',
        html: `<div style="width:${size * 2}px;height:${size * 2}px;border-radius:50%;background:${color};border:2px solid ${color};box-shadow:0 0 10px ${color}40;display:flex;align-items:center;justify-content:center;opacity:0.9;"></div>`,
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size]
    });
}

const cameraIcon = createIcon('#22d3ee');
const droneIcon = createIcon('#a78bfa', 14);
const sensorIcon = createIcon('#10b981', 8);
const offlineIcon = createIcon('#ef4444', 8);

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
    const center = [-6.2383, 106.9756];

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
