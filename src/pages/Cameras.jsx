import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Camera, Search, Filter, Wifi, WifiOff, MapPin, Plus, Edit, Trash2, X } from 'lucide-react';
import { formatTimeAgo } from '../hooks/useApi';
import { GET_CAMERAS, ADD_CAMERA, UPDATE_CAMERA, DELETE_CAMERA } from '../graphql/cameraQueries';

export default function Cameras() {
    const { data, loading, error, refetch } = useQuery(GET_CAMERAS);
    const [addCamera] = useMutation(ADD_CAMERA, { onCompleted: () => { refetch(); setIsModalOpen(false); } });
    const [updateCamera] = useMutation(UPDATE_CAMERA, { onCompleted: () => { refetch(); setIsModalOpen(false); } });
    const [deleteCamera] = useMutation(DELETE_CAMERA, { onCompleted: () => refetch() });

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCamera, setEditingCamera] = useState(null);

    const cameras = data?.cameras || [];
    const filtered = cameras.filter(c => {
        if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.id.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (typeFilter !== 'all' && c.type !== typeFilter) return false;
        return true;
    });

    const statusCounts = {
        all: cameras.length,
        online: cameras.filter(c => c.status === 'online').length,
        offline: cameras.filter(c => c.status === 'offline').length,
        maintenance: cameras.filter(c => c.status === 'maintenance').length
    };

    const handleOpenModal = (camera = null) => {
        setEditingCamera(camera);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this camera?')) {
            deleteCamera({ variables: { id } });
        }
    };

    const CameraModal = () => {
        const [formData, setFormData] = useState(editingCamera || {
            name: '',
            type: 'Fixed',
            protocol: 'RTSP',
            resolution: '1920x1080',
            zone: 'Main Entrance',
            industry: 'security',
            status: 'online'
        });

        const handleSubmit = (e) => {
            e.preventDefault();
            const input = {
                name: formData.name,
                type: formData.type,
                protocol: formData.protocol,
                resolution: formData.resolution,
                zone: formData.zone,
                industry: formData.industry,
                status: formData.status
            };

            if (editingCamera) {
                updateCamera({ variables: { id: editingCamera.id, input } });
            } else {
                addCamera({ variables: { input } });
            }
        };

        return (
            <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
                <div className="modal-container" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">{editingCamera ? 'Edit Camera' : 'Add New Camera'}</h2>
                        <button className="btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Camera Name</label>
                            <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="Fixed">Fixed</option>
                                    <option value="PTZ">PTZ</option>
                                    <option value="Dome">Dome</option>
                                    <option value="Bullet">Bullet</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Protocol</label>
                                <select className="form-input" value={formData.protocol} onChange={e => setFormData({ ...formData, protocol: e.target.value })}>
                                    <option value="RTSP">RTSP</option>
                                    <option value="ONVIF">ONVIF</option>
                                    <option value="HTTP">HTTP</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Zone</label>
                            <input className="form-input" value={formData.zone} onChange={e => setFormData({ ...formData, zone: e.target.value })} />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">{editingCamera ? 'Update Camera' : 'Add Camera'}</button>
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
                    <h1 className="page-title">Camera Management</h1>
                    <p className="page-subtitle">{cameras.length} cameras registered • {statusCounts.online} online</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={16} /> Add Camera
                </button>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="search-input">
                    <Search size={16} />
                    <input placeholder="Search cameras..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-chips">
                    {Object.entries(statusCounts).map(([key, count]) => (
                        <button key={key} className={`filter-chip ${statusFilter === key ? 'active' : ''}`}
                            onClick={() => setStatusFilter(key)}>
                            {key === 'all' ? 'All' : key.charAt(0).toUpperCase() + key.slice(1)} ({count})
                        </button>
                    ))}
                </div>
                <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="PTZ">PTZ</option>
                    <option value="Fixed">Fixed</option>
                    <option value="Dome">Dome</option>
                    <option value="Bullet">Bullet</option>
                    <option value="Thermal">Thermal</option>
                </select>
            </div>

            {/* Table */}
            <div className="card">
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Protocol</th>
                                <th>Resolution</th>
                                <th>Zone</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Loading cameras...</td></tr>
                            ) : error ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--severity-critical)' }}>Error loading cameras: {error.message}</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>No cameras found</td></tr>
                            ) : (
                                filtered.map(cam => (
                                    <tr key={cam.id}>
                                        <td className="id-cell">{cam.id.slice(0, 8)}...</td>
                                        <td style={{ fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Camera size={14} style={{ color: 'var(--accent-cyan)' }} />
                                                {cam.name}
                                            </div>
                                        </td>
                                        <td>{cam.type}</td>
                                        <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{cam.protocol}</span></td>
                                        <td>{cam.resolution}</td>
                                        <td style={{ fontSize: 'var(--text-xs)' }}>{cam.zone}</td>
                                        <td><span className={`status-badge ${cam.status}`}><span className="status-badge-dot" />{cam.status}</span></td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="btn-edit" onClick={() => handleOpenModal(cam)} title="Edit"><Edit size={14} /></button>
                                                <button className="btn-delete" onClick={() => handleDelete(cam.id)} title="Delete"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && <CameraModal />}
        </div>
    );
}
