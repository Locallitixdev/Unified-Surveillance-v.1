import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import {
    Camera, Shield, AlertTriangle, Activity, Eye, Radio,
    Plane, ArrowUpRight, ArrowDownRight, Video, ChevronRight
} from 'lucide-react';
import { GET_CAMERAS } from '../graphql/cameraQueries';
import { GET_EVENTS, GET_ALERTS, GET_ANALYTICS_SUMMARY } from '../graphql/dashboardQueries';
import { formatTimeAgo } from '../hooks/useApi';
import HLSPlayer from '../components/HLSPlayer';

export default function Dashboard({ ws }) {
    const { data: qCameras } = useQuery(GET_CAMERAS, { fetchPolicy: 'network-only' });
    const { data: qSummary } = useQuery(GET_ANALYTICS_SUMMARY, { fetchPolicy: 'network-only' });
    const { data: qEvents } = useQuery(GET_EVENTS, { variables: { limit: 30 } });
    const { data: qAlerts } = useQuery(GET_ALERTS, { variables: { status: 'active' } });

    const [liveEvents, setLiveEvents] = useState([]);
    const [gridSize, setGridSize] = useState('3x3');

    // Merge API events with live WS events
    useEffect(() => {
        if (qEvents?.events) {
            setLiveEvents(prev => {
                const wsEvents = ws.events || [];
                const combined = [...wsEvents, ...qEvents.events];
                const unique = combined.filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i);
                return unique.slice(0, 50);
            });
        }
    }, [qEvents, ws.events]);

    const cameras = qCameras?.cameras || [];
    const onlineCameras = cameras.filter(c => c.status === 'online');
    const displayCameras = onlineCameras.slice(0, gridSize === '2x2' ? 4 : gridSize === '3x3' ? 9 : 16);

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
                        {['2x2', '3x3', '4x4'].map(size => (
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
                <div className="kpi-card">
                    <div className="kpi-icon cyan"><Camera size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-value">{summary.camerasOnline || onlineCameras.length}</div>
                        <div className="kpi-label">Cameras Online</div>
                        <div className="kpi-change up"><ArrowUpRight size={12} /> 99.2% uptime</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon rose"><AlertTriangle size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-value" style={{ color: 'var(--severity-critical)' }}>{summary.criticalAlerts || 0}</div>
                        <div className="kpi-label">Critical Alerts</div>
                        <div className="kpi-change down"><ArrowDownRight size={12} /> Active now</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon emerald"><Eye size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-value">{summary.totalDetections?.toLocaleString() || '0'}</div>
                        <div className="kpi-label">AI Detections</div>
                        <div className="kpi-change up"><ArrowUpRight size={12} /> Last 7 days</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon indigo"><Plane size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-value">{summary.dronesActive || 0}</div>
                        <div className="kpi-label">Drones Active</div>
                        <div className="kpi-change up"><ArrowUpRight size={12} /> Patrolling</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon amber"><Radio size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-value">{summary.sensorsActive || 0}</div>
                        <div className="kpi-label">IoT Sensors</div>
                        <div className="kpi-change up"><ArrowUpRight size={12} /> Active</div>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon purple"><Activity size={20} /></div>
                    <div className="kpi-content">
                        <div className="kpi-value">{summary.avgResponseTime || 0}s</div>
                        <div className="kpi-label">Avg Response Time</div>
                        <div className="kpi-change up"><ArrowUpRight size={12} /> -12% vs last week</div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="dashboard-grid">
                <div className="dashboard-main">
                    {/* Live Video Grid */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">
                                <Video size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                Live Camera Feeds
                            </span>
                            <span className="card-action">View All <ChevronRight size={12} /></span>
                        </div>
                        <div className={`video-grid grid-${gridSize}`}>
                            {displayCameras.map((cam, idx) => (
                                <VideoTile key={cam.id} camera={cam} index={idx} />
                            ))}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                            {[...ws.alerts.slice(0, 3), ...activeAlerts.slice(0, 5)].slice(0, 6).map((alert, i) => (
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
                            {liveEvents.slice(0, 20).map((event, i) => (
                                <EventItem key={event.id} event={event} isNew={i < ws.events.length && i < 3} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function VideoTile({ camera, index }) {
    const [timestamp, setTimestamp] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTimestamp(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const isOffline = camera.status === 'offline';
    const hasDetection = Math.random() > 0.5;
    const detectionTypes = ['Person', 'Vehicle', 'PPE Violation', 'Forklift', 'Crowd'];
    const detType = detectionTypes[index % detectionTypes.length];

    // Generate pseudo-random detection box positions based on index
    const boxLeft = 15 + (index * 13) % 50;
    const boxTop = 20 + (index * 17) % 40;

    return (
        <div className="video-tile">
            <div className="video-feed">
                {camera.streamUrl && !isOffline ? (
                    <HLSPlayer url={camera.streamUrl} className="video-feed-scene" autoPlay={true} />
                ) : (
                    <>
                        {/* Noise effect removed */}
                        <div className="video-feed-scene">
                            <Camera size={48} />
                        </div>
                    </>
                )}

                {/* Simulated AI detection boxes removed as per user request */}

                {isOffline && (
                    <div className="video-offline-overlay">
                        <Camera size={24} />
                        <span>Signal Lost</span>
                    </div>
                )}

                {/* Camera name overlay removed */}

                <div className="video-overlay-bottom">
                    <span className="video-timestamp">
                        {timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <span className="video-ai-badge detection">{camera.resolution}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EventItem({ event, isNew }) {
    const iconMap = {
        camera: Camera,
        drone: Plane,
        sensor: Radio
    };
    const Icon = iconMap[event.source] || Activity;

    return (
        <div className={`event-item ${isNew ? 'new' : ''}`}>
            <div className={`event-severity-bar ${event.severity}`} />
            <div className={`event-icon ${event.source}`}>
                <Icon size={14} />
            </div>
            <div className="event-content">
                <div className="event-title">{event.description}</div>
                <div className="event-meta">
                    <span>{event.sourceId}</span>
                    <span>•</span>
                    <span>{event.zone}</span>
                </div>
            </div>
            <span className="event-time">{formatTimeAgo(event.timestamp)}</span>
        </div>
    );
}
