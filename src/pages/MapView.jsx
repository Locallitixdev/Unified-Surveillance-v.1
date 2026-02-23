import { useEffect, useRef, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, Plane, Radio, Filter } from 'lucide-react';

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
    const { data: camerasData } = useApi('/cameras');
    const { data: dronesData } = useApi('/drones');
    const { data: sensorsData } = useApi('/sensors');
    const [filters, setFilters] = useState({ cameras: true, drones: true, sensors: true });

    const cameras = camerasData?.data || [];
    const drones = dronesData?.data || [];
    const sensors = sensorsData?.data || [];

    const center = [1.35, 103.84];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Map View</h1>
                    <p className="page-subtitle">Geographic overview of all surveillance assets</p>
                </div>
                <div className="filter-bar">
                    <button className={`filter-chip ${filters.cameras ? 'active' : ''}`}
                        onClick={() => setFilters(f => ({ ...f, cameras: !f.cameras }))}>
                        <Camera size={12} style={{ marginRight: '4px' }} /> Cameras ({cameras.length})
                    </button>
                    <button className={`filter-chip ${filters.drones ? 'active' : ''}`}
                        onClick={() => setFilters(f => ({ ...f, drones: !f.drones }))}>
                        <Plane size={12} style={{ marginRight: '4px' }} /> Drones ({drones.length})
                    </button>
                    <button className={`filter-chip ${filters.sensors ? 'active' : ''}`}
                        onClick={() => setFilters(f => ({ ...f, sensors: !f.sensors }))}>
                        <Radio size={12} style={{ marginRight: '4px' }} /> Sensors ({sensors.length})
                    </button>
                </div>
            </div>

            <div className="map-container">
                <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}
                    zoomControl={true}>
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    {filters.cameras && cameras.map(cam => (
                        <Marker key={cam.id} position={[cam.coordinates.lat, cam.coordinates.lng]}
                            icon={cam.status === 'online' ? cameraIcon : offlineIcon}>
                            <Popup>
                                <div style={{ color: '#0a0e1a', fontSize: '13px', minWidth: '180px' }}>
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
