import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Radio, Search, Thermometer, Wind, Flame, Volume2, Gauge, DoorOpen, Activity, Eye, Plus, Edit, Trash2, X } from 'lucide-react';
import { GET_SENSORS, ADD_SENSOR, UPDATE_SENSOR, DELETE_SENSOR } from '../graphql/sensorQueries';
import { formatTimeAgo } from '../hooks/useApi';

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
    const { data, loading, error, refetch } = useQuery(GET_SENSORS);
    const [addSensor] = useMutation(ADD_SENSOR, { onCompleted: () => { refetch(); setIsModalOpen(false); } });
    const [updateSensor] = useMutation(UPDATE_SENSOR, { onCompleted: () => { refetch(); setIsModalOpen(false); } });
    const [deleteSensor] = useMutation(DELETE_SENSOR, { onCompleted: () => refetch() });

    const [typeFilter, setTypeFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [liveSensors, setLiveSensors] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSensor, setEditingSensor] = useState(null);

    // Track live sensor updates
    useEffect(() => {
        if (ws?.sensorUpdates?.length > 0) {
            const latest = ws.sensorUpdates[0];
            setLiveSensors(prev => ({ ...prev, [latest.sensorId]: latest }));
        }
    }, [ws?.sensorUpdates]);

    const sensors = (data?.sensors || []).filter(s => {
        if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.id.toLowerCase().includes(search.toLowerCase())) return false;
        if (typeFilter !== 'all' && s.type !== typeFilter) return false;
        return true;
    });

    const types = [...new Set((data?.sensors || []).map(s => s.type))];

    const handleOpenModal = (sensor = null) => {
        setEditingSensor(sensor);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this sensor?')) {
            deleteSensor({ variables: { id } });
        }
    };

    const SensorModal = () => {
        const [formData, setFormData] = useState(editingSensor || {
            name: '',
            type: 'temperature',
            industry: 'oil_gas',
            zone: 'Main Hall',
            status: 'active',
            threshold: 50,
            unit: '°C'
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            const input = {
                name: formData.name,
                type: formData.type,
                industry: formData.industry,
                zone: formData.zone,
                status: formData.status,
                threshold: parseFloat(formData.threshold),
                unit: formData.unit
            };

            if (editingSensor) {
                updateSensor({ variables: { id: editingSensor.id, input } });
            } else {
                addSensor({ variables: { input } });
            }
        };

        return (
            <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
                <div className="modal-container" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">{editingSensor ? 'Edit Sensor' : 'Add New Sensor'}</h2>
                        <button className="btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Sensor Name</label>
                            <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    {Object.keys(typeIcons).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Industry</label>
                                <select className="form-input" value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })}>
                                    <option value="oil_gas">Oil & Gas</option>
                                    <option value="warehouse">Warehouse</option>
                                    <option value="smart_city">Smart City</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Zone</label>
                            <input className="form-input" value={formData.zone} onChange={e => setFormData({ ...formData, zone: e.target.value })} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Threshold</label>
                                <input type="number" className="form-input" value={formData.threshold} onChange={e => setFormData({ ...formData, threshold: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Unit</label>
                                <input className="form-input" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">{editingSensor ? 'Update Sensor' : 'Add Sensor'}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">IoT Sensors</h1>
                    <p className="page-subtitle">{loading ? 'Loading...' : `${sensors.length} sensors • ${sensors.filter(s => s.status === 'active').length} active`}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <div className="search-input">
                        <Search size={16} />
                        <input placeholder="Search sensors..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} style={{ marginRight: '8px' }} /> Add Sensor
                    </button>
                </div>
            </div>

            {error && <div className="card" style={{ color: 'var(--severity-critical)', padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>Error: {error.message}</div>}

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
                        <div key={sensor.id} className="sensor-card" style={{ position: 'relative' }}>
                            <div className="table-actions" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                <button className="btn-edit" onClick={() => handleOpenModal(sensor)}><Edit size={14} /></button>
                                <button className="btn-delete" onClick={() => handleDelete(sensor.id)}><Trash2 size={14} /></button>
                            </div>

                            <div className="sensor-card-header" style={{ paddingRight: '60px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <Icon size={16} style={{ color }} />
                                    <div>
                                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{sensor.name}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{sensor.id}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-sm)' }}>
                                <span className={`status-badge ${sensor.status}`}>
                                    <span className="status-badge-dot" />{sensor.status}
                                </span>
                                {(sensor.type !== 'motion' && sensor.type !== 'door') && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Threshold: {sensor.threshold} {sensor.unit}</span>
                                )}
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
                                <span>{sensor.zone}</span>
                                <span>{formatTimeAgo(sensor.lastReading)}</span>
                            </div>

                            <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-xs) var(--space-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                                {sensor.protocol} • Bat: {sensor.battery}%
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && <SensorModal />}
        </div>
    );
}
