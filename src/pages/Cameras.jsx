import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { Camera, Search, Wifi, WifiOff, Plus, Edit, Trash2, Play, Upload } from 'lucide-react';
import BatchUploadModal from '../components/BatchUploadModal';
import { formatTimeAgo } from '../utils/formatters';
import { GET_CAMERAS, ADD_CAMERA, UPDATE_CAMERA, DELETE_CAMERA } from '../graphql/cameraQueries';
import { CameraModal, OperatorView } from '../components/CameraModals';

export default function Cameras() {
    const [searchParams] = useSearchParams();
    const { data, loading, error, refetch } = useQuery(GET_CAMERAS, { fetchPolicy: 'network-only' });

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => {
        const status = searchParams.get('status');
        if (status) setStatusFilter(status);
    }, [searchParams]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCamera, setEditingCamera] = useState(null);
    const [viewingCamera, setViewingCamera] = useState(null);
    const [showBatchUpload, setShowBatchUpload] = useState(false);

    const [addCamera] = useMutation(ADD_CAMERA, { onCompleted: () => { refetch(); setIsModalOpen(false); } });
    const [updateCamera] = useMutation(UPDATE_CAMERA, { onCompleted: () => { refetch(); setIsModalOpen(false); } });
    const [deleteCamera] = useMutation(DELETE_CAMERA, { onCompleted: () => refetch() });

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

    const handleCloseModal = () => setIsModalOpen(false);

    const handleModalSubmit = (input, isEdit) => {
        if (isEdit) {
            updateCamera({ variables: { id: editingCamera.id, input } });
        } else {
            addCamera({ variables: { input } });
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this camera?')) {
            deleteCamera({ variables: { id } });
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Camera Management</h1>
                    <p className="page-subtitle">{cameras.length} cameras registered • {statusCounts.online} online</p>
                </div>
                <div className="flex-center-gap">
                    <button className="btn btn-secondary" onClick={() => setShowBatchUpload(true)}>
                        <Upload size={16} /> Batch Upload
                    </button>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} /> Add Camera
                    </button>
                </div>
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
                                <tr><td colSpan="8" className="table-empty-state">Loading cameras...</td></tr>
                            ) : error ? (
                                <tr><td colSpan="8" className="table-empty-state table-error">Error loading cameras: {error.message}</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="8" className="table-empty-state">No cameras found</td></tr>
                            ) : (
                                filtered.map(cam => (
                                    <tr key={cam.id}>
                                        <td className="id-cell">{cam.id.slice(0, 8)}...</td>
                                        <td style={{ fontWeight: 500 }}>
                                            <div className="flex-center-gap">
                                                <Camera size={14} style={{ color: 'var(--accent-cyan)' }} />
                                                {cam.name}
                                            </div>
                                        </td>
                                        <td>{cam.type}</td>
                                        <td><span className="mono-text">{cam.protocol}</span></td>
                                        <td>{cam.resolution}</td>
                                        <td className="text-xs">{cam.zone}</td>
                                        <td><span className={`status-badge ${cam.status}`}><span className="status-badge-dot" />{cam.status}</span></td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="btn-icon btn-ghost" onClick={() => setViewingCamera(cam)} title="Live View"><Play size={14} /></button>
                                                <button className="btn-icon btn-edit" onClick={() => handleOpenModal(cam)} title="Edit"><Edit size={14} /></button>
                                                <button className="btn-icon btn-delete" onClick={() => handleDelete(cam.id)} title="Delete"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )).reverse()
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <CameraModal
                    editingCamera={editingCamera}
                    onClose={handleCloseModal}
                    onSubmit={handleModalSubmit}
                />
            )}
            {viewingCamera && (
                <OperatorView
                    camera={viewingCamera}
                    cameras={cameras}
                    onClose={() => setViewingCamera(null)}
                />
            )}
            {showBatchUpload && (
                <BatchUploadModal
                    onClose={() => setShowBatchUpload(false)}
                    onComplete={() => refetch()}
                />
            )}
        </div>
    );
}
