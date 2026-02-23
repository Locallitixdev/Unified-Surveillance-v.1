import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Plane, Battery, MapPin, Search, Gauge, Clock } from 'lucide-react';

export default function Drones() {
    const { data } = useApi('/drones');
    const [search, setSearch] = useState('');

    const drones = (data?.data || []).filter(d =>
        !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Drone Fleet</h1>
                    <p className="page-subtitle">{data?.total || 0} drones registered • {drones.filter(d => d.status === 'patrolling').length} active</p>
                </div>
                <div className="search-input">
                    <Search size={16} />
                    <input placeholder="Search drones..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-lg)' }}>
                {drones.map(drone => (
                    <div key={drone.id} className="card" style={{ padding: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div className="kpi-icon purple" style={{ width: '36px', height: '36px' }}>
                                    <Plane size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{drone.name}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{drone.id}</div>
                                </div>
                            </div>
                            <span className={`status-badge ${drone.status}`}>
                                <span className="status-badge-dot" />{drone.status}
                            </span>
                        </div>

                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                            {drone.model}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                <Battery size={14} style={{ color: drone.battery < 20 ? 'var(--severity-critical)' : drone.battery < 50 ? 'var(--severity-high)' : 'var(--accent-emerald)' }} />
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{drone.battery}%</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                <Gauge size={14} />
                                <span style={{ fontFamily: 'var(--font-mono)' }}>{drone.speed} km/h</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                <MapPin size={14} />
                                <span>{drone.altitude}m alt</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                <Clock size={14} />
                                <span>{drone.flightTime}min</span>
                            </div>
                        </div>

                        <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            <MapPin size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                            {drone.assignedZone}
                        </div>

                        {/* Battery bar */}
                        <div className="sensor-bar" style={{ marginTop: 'var(--space-md)' }}>
                            <div className="sensor-bar-fill" style={{
                                width: `${drone.battery}%`,
                                background: drone.battery < 20 ? 'var(--severity-critical)' : drone.battery < 50 ? 'var(--severity-high)' : 'var(--accent-emerald)'
                            }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
