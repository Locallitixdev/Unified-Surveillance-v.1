import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
    Camera, AlertTriangle, Activity, Eye, Radio,
    Plane, ArrowUpRight, ArrowDownRight, Video, ChevronRight
} from 'lucide-react';
import { GET_CAMERAS } from '../graphql/cameraQueries';
import { GET_EVENTS, GET_ALERTS, GET_ANALYTICS_SUMMARY } from '../graphql/dashboardQueries';
import { formatTimeAgo } from '../utils/formatters';
import { VideoTile, EventItem } from '../components/DashboardWidgets';

const GRID_OPTIONS = ['2x2', '3x3', '4x4'];
const GRID_COUNTS = { '2x2': 4, '3x3': 9, '4x4': 16 };
const MAX_EVENTS = 50;
const MAX_VISIBLE_EVENTS = 20;
const MAX_VISIBLE_ALERTS = 6;

export default function Dashboard({ ws }) {
    const navigate = useNavigate();
    const { data: qCameras } = useQuery(GET_CAMERAS, { fetchPolicy: 'network-only' });
    const { data: qSummary } = useQuery(GET_ANALYTICS_SUMMARY, { fetchPolicy: 'network-only' });
    const { data: qEvents } = useQuery(GET_EVENTS, { variables: { limit: 30 } });
    const { data: qAlerts } = useQuery(GET_ALERTS, { variables: { status: 'active' } });

    const [liveEvents, setLiveEvents] = useState([]);
    const [gridSize, setGridSize] = useState('3x3');
    const [isLiveAll, setIsLiveAll] = useState(false);

    // Snapshots are now handled entirely on the frontend via StreamSnapshot component in VideoTile

    // Merge API events with live WS events
    useEffect(() => {
        if (qEvents?.events && Array.isArray(qEvents.events)) {
            setLiveEvents(() => {
                const wsEvents = Array.isArray(ws.events) ? ws.events : [];
                const combined = [...wsEvents, ...qEvents.events];
                const unique = combined.filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i);
                return unique.slice(0, MAX_EVENTS);
            });
        }
    }, [qEvents, ws.events]);

    const cameras = qCameras?.cameras || [];
    const onlineCameras = cameras.filter(c => c.status === 'online');

    // Backend snapshots are deprecated. Frontend now captures frames directly.
    const snapshotsMap = {};

    const displayCameras = onlineCameras;

    const summary = qSummary?.analyticsSummary || {};
    const activeAlerts = qAlerts?.alerts || [];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Command Center</h1>
                    <p className="page-subtitle">Real-time intelligence surveillance dashboard</p>
                </div>
                <div className="filter-bar">
                    <div className="filter-chips">
                        {GRID_OPTIONS.map(size => (
                            <button key={size} className={`filter-chip ${gridSize === size ? 'active' : ''}`}
                                onClick={() => setGridSize(size)}>
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <KPICard icon={Camera} color="cyan" value={summary.camerasOnline || onlineCameras.length} label="Cameras Online" change="99.2% uptime" up />
                <KPICard icon={AlertTriangle} color="rose" value={summary.criticalAlerts || 0} label="Critical Alerts" change="Active now" valueColor="var(--severity-critical)" />
                <KPICard icon={Eye} color="emerald" value={summary.totalDetections?.toLocaleString() || '0'} label="AI Detections" change="Last 7 days" up />
                <KPICard icon={Plane} color="indigo" value={summary.dronesActive || 0} label="Drones Active" change="Patrolling" up />
                <KPICard icon={Radio} color="amber" value={summary.sensorsActive || 0} label="IoT Sensors" change="Active" up />
                <KPICard icon={Activity} color="purple" value={`${summary.avgResponseTime || 0}s`} label="Avg Response Time" change="-12% vs last week" up />
            </div>

            {/* Main Grid */}
            <div className="dashboard-grid">
                <div className="dashboard-main">
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">
                                <Video size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                Live Camera Feeds
                            </span>
                            <div className="card-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div className="live-toggle-wrapper">
                                    <span className={`toggle-label ${isLiveAll ? 'active' : ''}`}>LIVE ALL</span>
                                    <button
                                        className={`master-switch ${isLiveAll ? 'on' : 'off'}`}
                                        onClick={() => setIsLiveAll(!isLiveAll)}
                                        title={isLiveAll ? "Switch all to snapshots" : "Activate all live feeds"}
                                    >
                                        <div className="switch-handle" />
                                    </button>
                                </div>
                                <span className="card-action" onClick={() => navigate('/cameras?status=online')} style={{ cursor: 'pointer', opacity: 0.7 }}>
                                    View All <ChevronRight size={12} />
                                </span>
                            </div>
                        </div>
                        <div className="video-grid-container custom-scrollbar card-mode">
                            <div className="video-grid cards-layout">
                                {displayCameras.map(cam => (
                                    <VideoTile
                                        key={cam.id}
                                        camera={cam}
                                        isLiveAll={isLiveAll}
                                        snapshotUrl={snapshotsMap[cam.id]}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-side">
                    {/* Alert Summary */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">
                                <AlertTriangle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                Active Alerts
                            </span>
                            <span className="card-action">{activeAlerts.length} total</span>
                        </div>
                        <div className="alert-list-container">
                            {[...(ws?.alerts || []).slice(0, 3), ...(activeAlerts || []).slice(0, 5)].slice(0, MAX_VISIBLE_ALERTS).map((alert, i) => (
                                <div key={alert.id || i} className={`alert-card ${alert.severity}`} style={{ padding: '10px 12px' }}>
                                    <div className="alert-card-header">
                                        <span className="alert-card-title" style={{ fontSize: 'var(--text-sm)' }}>{alert.title}</span>
                                        <span className={`severity-badge ${alert.severity}`}>{alert.severity}</span>
                                    </div>
                                    <div className="alert-card-meta" style={{ marginTop: '4px' }}>
                                        <span>{alert.zone}</span>
                                        <span>•</span>
                                        <span>{formatTimeAgo(alert.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Event Timeline */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">
                                <Activity size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                Event Timeline
                            </span>
                            <span className="card-action">Live</span>
                        </div>
                        <div className="event-timeline">
                            {(liveEvents || []).slice(0, MAX_VISIBLE_EVENTS).map((event, i) => (
                                <EventItem key={event.id} event={event} isNew={i < (ws?.events?.length || 0) && i < 3} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Reusable KPI card component for the dashboard summary row.
 */
function KPICard({ icon: Icon, color, value, label, change, up = false, valueColor }) {
    return (
        <div className="kpi-card">
            <div className={`kpi-icon ${color}`}><Icon size={20} /></div>
            <div className="kpi-content">
                <div className="kpi-value" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
                <div className="kpi-label">{label}</div>
                <div className={`kpi-change ${up ? 'up' : 'down'}`}>
                    {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {change}
                </div>
            </div>
        </div>
    );
}
