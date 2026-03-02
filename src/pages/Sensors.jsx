import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Radio, Search, Thermometer, Wind, Flame, Volume2, Gauge, DoorOpen, Activity, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { GET_SENSORS, ADD_SENSOR, UPDATE_SENSOR, DELETE_SENSOR } from '../graphql/sensorQueries';
import { formatTimeAgo } from '../utils/formatters';
import { SensorModal } from '../components/SensorModal';

const TYPE_ICONS = {
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

const TYPE_COLORS = {
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

const BINARY_SENSOR_TYPES = ['motion', 'door'];

export default function Sensors({ ws }) {
    const { data, loading, error, refetch } = useQuery(GET_SENSORS);

    const [typeFilter, setTypeFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [liveSensors, setLiveSensors] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSensor, setEditingSensor] = useState(null);

    const [addSensor] = useMutation(ADD_SENSOR, { onCompleted: () => { refetch(); setIsModalOpen(false); } });
    const [updateSensor] = useMutation(UPDATE_SENSOR, { onCompleted: () => { refetch(); setIsModalOpen(false); } });
    const [deleteSensor] = useMutation(DELETE_SENSOR, { onCompleted: () => refetch() });

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

    const handleCloseModal = () => setIsModalOpen(false);

    const handleModalSubmit = (input, isEdit) => {
        if (isEdit) {
            updateSensor({ variables: { id: editingSensor.id, input } });
        } else {
            addSensor({ variables: { input } });
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this sensor?')) {
            deleteSensor({ variables: { id } });
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">IoT Sensors</h1>
                    <p className="page-subtitle">{loading ? 'Loading...' : `${sensors.length} sensors • ${sensors.filter(s => s.status === 'active').length} active`}</p>
                </div>
                <div className="page-header-actions">
                    <div className="search-input">
                        <Search size={16} />
                        <input placeholder="Search sensors..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} style={{ marginRight: '8px' }} /> Add Sensor
                    </button>
                </div>
            </div>

            {error && <div className="card error-banner">Error: {error.message}</div>}

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

            <div className="sensor-grid">
                {sensors.map(sensor => (
                    <SensorCard
                        key={sensor.id}
                        sensor={sensor}
                        liveData={liveSensors[sensor.id]}
                        onEdit={() => handleOpenModal(sensor)}
                        onDelete={() => handleDelete(sensor.id)}
                    />
                ))}
            </div>

            {isModalOpen && (
                <SensorModal
                    editingSensor={editingSensor}
                    onClose={handleCloseModal}
                    onSubmit={handleModalSubmit}
                />
            )}
        </div>
    );
}

/**
 * Individual sensor display card.
 */
function SensorCard({ sensor, liveData, onEdit, onDelete }) {
    const Icon = TYPE_ICONS[sensor.type] || Radio;
    const color = TYPE_COLORS[sensor.type] || 'var(--accent-cyan)';
    const isBinary = BINARY_SENSOR_TYPES.includes(sensor.type);

    const currentValue = liveData ? liveData.value : sensor.value;
    const isAbove = currentValue > sensor.threshold;
    const THRESHOLD_MULTIPLIER = 1.5;
    const WARN_THRESHOLD_PCT = 70;
    const fillPct = isBinary
        ? currentValue * 100
        : Math.min((currentValue / (sensor.threshold * THRESHOLD_MULTIPLIER)) * 100, 100);

    const displayValue = typeof currentValue === 'number'
        ? (isBinary ? (currentValue ? 'ACTIVE' : 'IDLE') : currentValue.toFixed(1))
        : currentValue;

    return (
        <div className="sensor-card">
            <div className="table-actions sensor-card-actions">
                <button className="btn-edit" onClick={onEdit}><Edit size={14} /></button>
                <button className="btn-delete" onClick={onDelete}><Trash2 size={14} /></button>
            </div>

            <div className="sensor-card-header" style={{ paddingRight: '60px' }}>
                <div className="flex-center-gap">
                    <Icon size={16} style={{ color }} />
                    <div>
                        <div className="sensor-name">{sensor.name}</div>
                        <div className="sensor-id">{sensor.id}</div>
                    </div>
                </div>
            </div>

            <div className="sensor-status-row">
                <span className={`status-badge ${sensor.status}`}>
                    <span className="status-badge-dot" />{sensor.status}
                </span>
                {!isBinary && (
                    <span className="sensor-threshold-label">Threshold: {sensor.threshold} {sensor.unit}</span>
                )}
            </div>

            <div className="sensor-value-container">
                <span className={`sensor-value ${isAbove ? 'danger' : 'normal'}`}>{displayValue}</span>
                {!isBinary && <span className="sensor-unit">{sensor.unit}</span>}
            </div>

            <div className="sensor-bar">
                <div className="sensor-bar-fill" style={{
                    width: `${fillPct}%`,
                    background: isAbove ? 'var(--severity-critical)' : fillPct > WARN_THRESHOLD_PCT ? 'var(--severity-high)' : color
                }} />
            </div>

            <div className="sensor-footer">
                <span>{sensor.zone}</span>
                <span>{formatTimeAgo(sensor.lastReading)}</span>
            </div>

            <div className="sensor-protocol-info">
                {sensor.protocol} • Bat: {sensor.battery}%
            </div>
        </div>
    );
}
