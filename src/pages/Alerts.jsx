import { useState, useEffect } from 'react';
import { useApi, formatTimeAgo } from '../hooks/useApi';
import { Bell, Search, CheckCircle, AlertTriangle, XCircle, Shield, Clock, MapPin, Filter } from 'lucide-react';

export default function Alerts({ ws }) {
    const { data } = useApi('/alerts');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [liveAlerts, setLiveAlerts] = useState([]);

    useEffect(() => {
        if (data?.data) {
            setLiveAlerts(prev => {
                const combined = [...(ws?.alerts || []), ...data.data];
                const unique = combined.filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i);
                return unique;
            });
        }
    }, [data, ws?.alerts]);

    const filtered = liveAlerts.filter(a => {
        if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        return true;
    });

    const severityCounts = {
        all: liveAlerts.length,
        critical: liveAlerts.filter(a => a.severity === 'critical').length,
        high: liveAlerts.filter(a => a.severity === 'high').length,
        medium: liveAlerts.filter(a => a.severity === 'medium').length,
        low: liveAlerts.filter(a => a.severity === 'low').length
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Alert Management</h1>
                    <p className="page-subtitle">{liveAlerts.filter(a => a.status === 'active').length} active alerts • {liveAlerts.length} total</p>
                </div>
            </div>

            {/* Severity KPI */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 'var(--space-xl)' }}>
                {[
                    { label: 'Critical', count: severityCounts.critical, color: 'var(--severity-critical)', icon: XCircle, iconClass: 'rose' },
                    { label: 'High', count: severityCounts.high, color: 'var(--severity-high)', icon: AlertTriangle, iconClass: 'amber' },
                    { label: 'Medium', count: severityCounts.medium, color: 'var(--severity-medium)', icon: Shield, iconClass: 'blue' },
                    { label: 'Low', count: severityCounts.low, color: 'var(--severity-low)', icon: Bell, iconClass: 'purple' }
                ].map(item => (
                    <div key={item.label} className="kpi-card" onClick={() => setSeverityFilter(item.label.toLowerCase())}
                        style={{ cursor: 'pointer' }}>
                        <div className={`kpi-icon ${item.iconClass}`}><item.icon size={20} /></div>
                        <div className="kpi-content">
                            <div className="kpi-value" style={{ color: item.color }}>{item.count}</div>
                            <div className="kpi-label">{item.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="filter-bar" style={{ marginBottom: 'var(--space-xl)' }}>
                <div className="search-input">
                    <Search size={16} />
                    <input placeholder="Search alerts..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-chips">
                    {['all', 'critical', 'high', 'medium', 'low'].map(sev => (
                        <button key={sev} className={`filter-chip ${severityFilter === sev ? 'active' : ''}`}
                            onClick={() => setSeverityFilter(sev)}>
                            {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                        </button>
                    ))}
                </div>
                <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>

            {/* Alert List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {filtered.map((alert, i) => (
                    <div key={alert.id || i} className={`alert-card ${alert.severity}`}>
                        <div className="alert-card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1 }}>
                                <span className={`severity-badge ${alert.severity}`}>{alert.severity}</span>
                                <span className="alert-card-title">{alert.title}</span>
                            </div>
                            <span className={`status-badge ${alert.status}`}>
                                <span className="status-badge-dot" />{alert.status}
                            </span>
                        </div>
                        <div className="alert-card-body">{alert.description}</div>
                        <div className="alert-card-footer">
                            <div className="alert-card-meta">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Clock size={10} /> {formatTimeAgo(alert.timestamp)}
                                </span>
                                {alert.zone && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <MapPin size={10} /> {alert.zone}
                                    </span>
                                )}
                                {alert.sources && (
                                    <span>Sources: {alert.sources.join(', ')}</span>
                                )}
                            </div>
                            <div className="alert-card-actions">
                                {alert.status === 'active' && (
                                    <>
                                        <button className="btn btn-secondary btn-sm">Acknowledge</button>
                                        <button className="btn btn-primary btn-sm">Resolve</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
