import { useState } from 'react';
import { useApi, formatTimeAgo } from '../hooks/useApi';
import { Camera, Search, Filter, Wifi, WifiOff, MapPin } from 'lucide-react';

export default function Cameras() {
    const { data, loading } = useApi('/cameras');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const cameras = data?.data || [];
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

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Camera Management</h1>
                    <p className="page-subtitle">{cameras.length} cameras registered • {statusCounts.online} online</p>
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
                                <th>Industry</th>
                                <th>Status</th>
                                <th>Last Detection</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(cam => (
                                <tr key={cam.id}>
                                    <td className="id-cell">{cam.id}</td>
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
                                    <td>
                                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>
                                            {cam.industry.replace('_', ' & ')}
                                        </span>
                                    </td>
                                    <td><span className={`status-badge ${cam.status}`}><span className="status-badge-dot" />{cam.status}</span></td>
                                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{formatTimeAgo(cam.lastDetection)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
