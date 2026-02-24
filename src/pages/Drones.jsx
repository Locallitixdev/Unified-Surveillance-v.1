import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Plane, Battery, MapPin, Search, Gauge, Clock, Plus, Edit, Trash2, X } from 'lucide-react';
import { GET_DRONES, ADD_DRONE, UPDATE_DRONE, DELETE_DRONE } from '../graphql/droneQueries';

export default function Drones() {
    const { data, loading, error, refetch } = useQuery(GET_DRONES);
    const [addDrone] = useMutation(ADD_DRONE, { onCompleted: () => { refetch(); setIsModalOpen(false); } });
    const [updateDrone] = useMutation(UPDATE_DRONE, { onCompleted: () => { refetch(); setIsModalOpen(false); } });
    const [deleteDrone] = useMutation(DELETE_DRONE, { onCompleted: () => refetch() });

    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDrone, setEditingDrone] = useState(null);

    const drones = (data?.drones || []).filter(d =>
        !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenModal = (drone = null) => {
        setEditingDrone(drone);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this drone?')) {
            deleteDrone({ variables: { id } });
        }
    };

    const DroneModal = () => {
        const [formData, setFormData] = useState(editingDrone || {
            name: '',
            model: 'DJI Matrice 350',
            industry: 'oil_gas',
            assignedZone: 'Sector A',
            status: 'docked',
            battery: 100,
            altitude: 0,
            speed: 0,
            flightTime: 0
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            const input = {
                name: formData.name,
                model: formData.model,
                industry: formData.industry,
                assignedZone: formData.assignedZone,
                status: formData.status,
                battery: parseInt(formData.battery),
                altitude: parseFloat(formData.altitude),
                speed: parseFloat(formData.speed),
                flightTime: parseInt(formData.flightTime)
            };

            if (editingDrone) {
                updateDrone({ variables: { id: editingDrone.id, input } });
            } else {
                addDrone({ variables: { input } });
            }
        };

        return (
            <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
                <div className="modal-container" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">{editingDrone ? 'Edit Drone' : 'Add New Drone'}</h2>
                        <button className="btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Drone Name</label>
                            <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            <div className="form-group">
                                <label className="form-label">Model</label>
                                <input className="form-input" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} required />
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
                            <label className="form-label">Assigned Zone</label>
                            <input className="form-input" value={formData.assignedZone} onChange={e => setFormData({ ...formData, assignedZone: e.target.value })} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="docked">Docked</option>
                                    <option value="patrolling">Patrolling</option>
                                    <option value="returning">Returning</option>
                                    <option value="charging">Charging</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Battery (%)</label>
                                <input type="number" className="form-input" value={formData.battery} onChange={e => setFormData({ ...formData, battery: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">{editingDrone ? 'Update Drone' : 'Add Drone'}</button>
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
                    <h1 className="page-title">Drone Fleet</h1>
                    <p className="page-subtitle">{loading ? 'Loading...' : `${drones.length} drones registered • ${drones.filter(d => d.status === 'patrolling').length} active`}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <div className="search-input">
                        <Search size={16} />
                        <input placeholder="Search drones..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} style={{ marginRight: '8px' }} /> Add Drone
                    </button>
                </div>
            </div>

            {error && <div className="card" style={{ color: 'var(--severity-critical)', padding: 'var(--space-lg)' }}>Error: {error.message}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-lg)' }}>
                {drones.map(drone => (
                    <div key={drone.id} className="card" style={{ padding: 'var(--space-lg)', position: 'relative' }}>
                        <div className="table-actions" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                            <button className="btn-edit" onClick={() => handleOpenModal(drone)}><Edit size={14} /></button>
                            <button className="btn-delete" onClick={() => handleDelete(drone.id)}><Trash2 size={14} /></button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)', paddingRight: '60px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div className="kpi-icon purple" style={{ width: '36px', height: '36px' }}>
                                    <Plane size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{drone.name}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{drone.id}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                {drone.model}
                            </div>
                            <span className={`status-badge ${drone.status}`}>
                                <span className="status-badge-dot" />{drone.status}
                            </span>
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

                        <div className="sensor-bar" style={{ marginTop: 'var(--space-md)' }}>
                            <div className="sensor-bar-fill" style={{
                                width: `${drone.battery}%`,
                                background: drone.battery < 20 ? 'var(--severity-critical)' : drone.battery < 50 ? 'var(--severity-high)' : 'var(--accent-emerald)'
                            }} />
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && <DroneModal />}
        </div>
    );
}
