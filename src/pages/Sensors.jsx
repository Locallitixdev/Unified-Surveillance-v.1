import { useState, useEffect } from 'react';
import { useApi, formatTimeAgo } from '../hooks/useApi';
import { Radio, Search, Thermometer, Wind, Flame, Volume2, Gauge, DoorOpen, Activity, Eye } from 'lucide-react';

const typeIcons = {
    temperature: Thermometer,
    humidity: Wind,
    gas: Flame,
    vibration: Activity,
    motion: Eye,
    door: DoorOpen,
    smoke: Flame,
    pressure: Gauge,
    noise: Volume2
};

const typeColors = {
    temperature: 'var(--accent-rose)',
    humidity: 'var(--accent-blue)',
    gas: 'var(--severity-critical)',
    vibration: 'var(--accent-amber)',
    motion: 'var(--accent-cyan)',
    door: 'var(--accent-purple)',
    smoke: 'var(--severity-high)',
    pressure: 'var(--accent-indigo)',
    noise: 'var(--accent-emerald)'
};

export default function Sensors({ ws }) {
    const { data } = useApi('/sensors');
    const [typeFilter, setTypeFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [liveSensors, setLiveSensors] = useState({});

    // Track live sensor updates
    useEffect(() => {
        if (ws?.sensorUpdates?.length > 0) {
            const latest = ws.sensorUpdates[0];
            setLiveSensors(prev => ({ ...prev, [latest.sensorId]: latest }));
        }
    }, [ws?.sensorUpdates]);

    const sensors = (data?.data || []).filter(s => {
        if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.id.toLowerCase().includes(search.toLowerCase())) return false;
        if (typeFilter !== 'all' && s.type !== typeFilter) return false;
        return true;
    });

    const types = [...new Set((data?.data || []).map(s => s.type))];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">IoT Sensors</h1>
                    <p className="page-subtitle">{data?.total || 0} sensors • {(data?.data || []).filter(s => s.status === 'active').length} active</p>
                </div>
                <div className="search-input">
                    <Search size={16} />
                    <input placeholder="Search sensors..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="filter-bar" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="filter-chips">
                    <button className={`filter-chip ${typeFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setTypeFilter('all')}>All</button>
                    {types.map(type => (
                        <button key={type} className={`filter-chip ${typeFilter === type ? 'active' : ''}`}
                            onClick={() => setTypeFilter(type)}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-lg)' }}>
                {sensors.map(sensor => {
                    const Icon = typeIcons[sensor.type] || Radio;
                    const color = typeColors[sensor.type] || 'var(--accent-cyan)';
                    const liveData = liveSensors[sensor.id];
                    const currentValue = liveData ? liveData.value : sensor.value;
                    const isAbove = currentValue > sensor.threshold;
                    const fillPct = sensor.type === 'motion' || sensor.type === 'door'
                        ? currentValue * 100
                        : Math.min((currentValue / (sensor.threshold * 1.5)) * 100, 100);

                    return (
                        <div key={sensor.id} className="sensor-card">
                            <div className="sensor-card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <Icon size={16} style={{ color }} />
                                    <div>
                                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{sensor.name}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{sensor.id}</div>
                                    </div>
                                </div>
                                <span className={`status-badge ${sensor.status}`}>
                                    <span className="status-badge-dot" />{sensor.status}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', padding: 'var(--space-md) 0' }}>
                                <span className={`sensor-value ${isAbove ? 'danger' : 'normal'}`}>
                                    {typeof currentValue === 'number' ? (sensor.type === 'motion' || sensor.type === 'door' ? (currentValue ? 'ACTIVE' : 'IDLE') : currentValue.toFixed(1)) : currentValue}
                                </span>
                                {sensor.type !== 'motion' && sensor.type !== 'door' && (
                                    <span className="sensor-unit">{sensor.unit}</span>
                                )}
                            </div>

                            <div className="sensor-bar">
                                <div className="sensor-bar-fill" style={{
                                    width: `${fillPct}%`,
                                    background: isAbove ? 'var(--severity-critical)' : fillPct > 70 ? 'var(--severity-high)' : color
                                }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-sm)', fontSize: '10px', color: 'var(--text-muted)' }}>
                                <span>Threshold: {sensor.threshold} {sensor.unit}</span>
                                <span>{formatTimeAgo(sensor.lastReading)}</span>
                            </div>

                            <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-xs) var(--space-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                {sensor.zone} • {sensor.protocol} • Bat: {sensor.battery}%
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
