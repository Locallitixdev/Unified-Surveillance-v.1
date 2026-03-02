import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, WifiOff, Map as MapIcon, Camera, Maximize2, Circle, Radar, Minimize2, Plane, ChevronDown, ChevronRight, Search, ArrowLeft, Zap, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HLSPlayer from './HLSPlayer';
import { useWebSocket } from '../hooks/useApi';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * Immersive Operator View for viewing a camera's live stream with tactical HUD.
 * Renders as a full-page overlay.
 */
export function OperatorView({ camera: initialCamera, cameras = [], onClose }) {
    const [currentCamera, setCurrentCamera] = useState(initialCamera);
    const [showMap, setShowMap] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [timestamp, setTimestamp] = useState(new Date().toLocaleString());
    const [nearbyCameras, setNearbyCameras] = useState([]);
    const [isLoadingNearby, setIsLoadingNearby] = useState(false);
    const [showNearby, setShowNearby] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRegions, setExpandedRegions] = useState({});
    const [isAiActive, setIsAiActive] = useState(false);
    const [aiEvents, setAiEvents] = useState([]);
    const [selectedSnapshot, setSelectedSnapshot] = useState(null);

    const { events: liveEvents } = useWebSocket();

    const nearbyRef = useRef(null);
    const playerRef = useRef(null);
    const modalRef = useRef(null);

    // Capture real-time events from WebSocket
    useEffect(() => {
        if (!isAiActive || !liveEvents || liveEvents.length === 0) return;

        const latestEvent = liveEvents[0];
        // Check if this event belongs to the current camera and is an AI event
        if (latestEvent.sourceId === currentCamera.id && latestEvent.description && (
            latestEvent.description.includes('[AI REALTIME]') ||
            latestEvent.description.includes('[AI YOLO11]') ||
            latestEvent.description.includes('[AI FALLBACK]')
        )) {
            // Prevent duplicates if the polling also caught it (unlikely with broken DB)
            setAiEvents(prev => {
                const exists = prev.some(e => e.id === latestEvent.id);
                if (exists) return prev;
                return [latestEvent, ...prev].slice(0, 10);
            });
        }
    }, [liveEvents, isAiActive, currentCamera.id]);

    // Fetch nearby assets for the current active camera
    useEffect(() => {
        const fetchNearby = async () => {
            setIsLoadingNearby(true);
            try {
                const res = await fetch(`/api/cameras/${currentCamera.id}/nearby`);
                const data = await res.json();
                setNearbyCameras(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to fetch nearby assets:', err);
                setNearbyCameras([]);
            } finally {
                setIsLoadingNearby(false);
            }
        };

        if (currentCamera?.id) fetchNearby();
    }, [currentCamera?.id]);

    // Group cameras by region (zone)
    const filteredCameras = cameras.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.zone && c.zone.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const groupedCameras = filteredCameras.reduce((acc, cam) => {
        const zone = cam.zone || 'OTHER';
        if (!acc[zone]) acc[zone] = [];
        acc[zone].push(cam);
        return acc;
    }, {});

    const regions = Object.keys(groupedCameras).sort();

    const toggleRegion = (region) => {
        setExpandedRegions(prev => ({ ...prev, [region]: !prev[region] }));
    };

    // Helper to get asset icon
    const getAssetIcon = (type) => {
        switch (type) {
            case 'drone': return <Plane size={14} className="text-indigo-400" />;
            case 'sensor': return <Radar size={14} className="text-emerald-400" />;
            default: return <Camera size={14} className="text-cyan-400" />;
        }
    };

    const toggleNearby = () => {
        setShowNearby(prev => !prev);
    };

    // Update digital clock
    useEffect(() => {
        const timer = setInterval(() => {
            setTimestamp(new Date().toLocaleString());
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    // Fetch initial AI detections, and poll if AI is active
    useEffect(() => {
        const fetchLatestDetections = async () => {
            try {
                // Fetch events specifically for this camera
                const res = await fetch(`/api/events?sourceId=${currentCamera.id}&limit=10`);
                const result = await res.json();
                const eventsList = result.data || result; // Handle both paginated and raw array fallback
                if (Array.isArray(eventsList) && eventsList.length > 0) {
                    // Filter for all AI-related events
                    const aiData = eventsList.filter(e => e.description && (
                        e.description.includes('[AI REALTIME]') ||
                        e.description.includes('[AI YOLO11]') ||
                        e.description.includes('[AI FALLBACK]')
                    ));
                    // Only update if we found AI events, to avoid clearing live events from WS
                    if (aiData.length > 0) {
                        setAiEvents(prev => {
                            // Merge and take latest 10
                            const combined = [...prev, ...aiData];
                            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                            return unique.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch AI events:', err);
            }
        };

        // Always fetch initial previously saved data
        fetchLatestDetections();

        let interval;
        if (isAiActive) {
            interval = setInterval(fetchLatestDetections, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isAiActive, currentCamera.id]);

    const toggleAI = async () => {
        const newState = !isAiActive;
        try {
            const endpoint = newState ? '/api/ai/start' : '/api/ai/stop';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cameraId: currentCamera.id })
            });
            if (res.ok) {
                setIsAiActive(newState);
                // Do not clear aiEvents when stopping, to show previous data
            }
        } catch (err) {
            console.error('Failed to toggle AI:', err);
        }
    };

    const handleScreenshot = () => {
        const video = playerRef.current;
        if (!video) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1920;
        canvas.height = video.videoHeight || 1080;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const link = document.createElement('a');
        link.download = `snapshot-${currentCamera.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            modalRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    if (!currentCamera) return null;

    return createPortal(
        <div
            ref={modalRef}
            className="operator-view-page"
        >
            {/* Main Content Area */}
            <div className="operator-main-content">
                {/* Back Button HUD */}
                <button className="btn-back-hud" onClick={onClose}>
                    <ArrowLeft size={16} />
                    BACK
                </button>

                {/* Top Left: Mini Map */}
                {currentCamera.coordinates && (
                    <div className={`hud-mini-map ${showMap ? '' : 'hidden'}`}>
                        <MapContainer
                            center={[currentCamera.coordinates.lat, currentCamera.coordinates.lng]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                            attributionControl={false}
                        >
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <Marker position={[currentCamera.coordinates.lat, currentCamera.coordinates.lng]} />
                        </MapContainer>
                    </div>
                )}

                <div className="operator-video-container">
                    {/* Video Player */}
                    {currentCamera.streamUrl ? (
                        <HLSPlayer
                            key={currentCamera.id} // Re-mount player when switching cameras
                            ref={playerRef}
                            url={currentCamera.streamUrl}
                            className="h-full w-full"
                            controls={false}
                        />
                    ) : (
                        <div className="stream-unavailable h-full flex items-center justify-center">
                            <div className="text-center">
                                <WifiOff size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="text-text-tertiary">No secure stream link available</p>
                            </div>
                        </div>
                    )}

                    {/* HUD Overlays */}
                    {/* Top Right: Timestamp */}
                    <div className="hud-top-right">
                        <div className="hud-panel">
                            <div className="hud-timestamp">{timestamp}</div>
                        </div>
                    </div>

                    {/* Bottom Left: Camera Info */}
                    <div className="hud-bottom-left">
                        <div className="hud-camera-group">
                            {currentCamera.zone || 'CENTRAL'} SYSTEM
                        </div>
                        <div className="hud-camera-name" style={{ fontSize: '1.4rem' }}>{currentCamera.name}</div>
                        <div className="hud-address">COORDINATES: {currentCamera.coordinates?.lat}, {currentCamera.coordinates?.lng}</div>
                        <div className="hud-operator-info">OPERATOR: ALPHA-01 • SCAN_MODE: ACTIVE</div>
                    </div>

                    {/* Bottom Right: Telemetry */}
                    <div className="hud-bottom-right">
                        <div className="hud-telemetry-grid">
                            <div className="hud-telemetry-row">
                                <span className="hud-telemetry-label">ZOOM</span>
                                <span>01.0x</span>
                            </div>
                            <div className="hud-telemetry-row">
                                <span className="hud-telemetry-label">PTZ_P</span>
                                <span>020°</span>
                            </div>
                            <div className="hud-telemetry-row">
                                <span className="hud-telemetry-label">PTZ_T</span>
                                <span>015°</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Nearby Panel */}
                {showNearby && (
                    <div className="hud-nearby-panel">
                        <div className="hud-nearby-header">
                            <Radar size={14} className="animate-pulse text-yellow-500" />
                            <span>NEARBY ASSETS</span>
                        </div>
                        <div className="hud-nearby-list">
                            {isLoadingNearby ? (
                                <div className="px-4 py-1 text-xs opacity-50">Scanning...</div>
                            ) : nearbyCameras.length > 0 ? (
                                nearbyCameras.map(nc => (
                                    <div key={nc.id} className="hud-nearby-item" onClick={() => setCurrentCamera(nc)}>
                                        {getAssetIcon(nc.assetType)}
                                        <span className="nc-name">{nc.name}</span>
                                        <span className="nc-dist">{nc.distanceStr}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-1 text-xs opacity-50">No assets detected</div>
                            )}
                        </div>
                    </div>
                )}


                {/* Bottom Center: Control Toolbar */}
                <div className="operator-toolbar">
                    <button
                        className={`toolbar-btn ${showMap ? 'active' : ''}`}
                        onClick={() => setShowMap(!showMap)}
                        title="Toggle Mini Map"
                    >
                        <MapIcon size={20} />
                    </button>
                    <button
                        className={`toolbar-btn ${showNearby ? 'active' : ''}`}
                        onClick={toggleNearby}
                        title="Toggle Nearby"
                    >
                        <Radar size={20} />
                    </button>
                    <button
                        className="toolbar-btn"
                        onClick={handleScreenshot}
                        title="Capture Frame"
                    >
                        <Camera size={20} />
                    </button>
                    <button
                        className={`toolbar-btn ${isRecording ? 'recording' : ''}`}
                        onClick={() => setIsRecording(!isRecording)}
                        title={isRecording ? 'Stop Recording' : 'Start Recording'}
                    >
                        <Circle size={20} fill={isRecording ? '#ef4444' : 'transparent'} />
                    </button>
                    <button
                        className={`toolbar-btn ${isAiActive ? 'active' : ''}`}
                        onClick={toggleAI}
                        style={isAiActive ? { color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)' } : {}}
                        title={isAiActive ? 'Deactivate AI Analytics' : 'Activate AI Analytics'}
                    >
                        <Zap size={20} className={isAiActive ? 'animate-pulse' : ''} />
                    </button>
                    <button
                        className="toolbar-btn"
                        onClick={toggleFullscreen}
                        title="Toggle Fullscreen"
                    >
                        <Maximize2 size={20} />
                    </button>
                </div>
            </div>

            {/* Sidebar: Channels */}
            <div className="operator-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-title">
                        <span>CHANNELS</span>
                        <span className="sidebar-camera-count">{cameras.length} ONLINE</span>
                    </div>
                    <div className="sidebar-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="Search camera..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="sidebar-scroll-container">
                    <div className="sidebar-list">
                        {regions.map(region => (
                            <div key={region} className="sidebar-region">
                                <div
                                    className="region-header"
                                    onClick={() => toggleRegion(region)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {expandedRegions[region] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        <span className="region-name">{region}</span>
                                    </div>
                                    <span className="region-status">{groupedCameras[region].length} UNIT</span>
                                </div>

                                {expandedRegions[region] && (
                                    <div className="region-items">
                                        {groupedCameras[region].map(cam => (
                                            <div
                                                key={cam.id}
                                                className={`sidebar-camera-item ${currentCamera.id === cam.id ? 'active' : ''}`}
                                                onClick={() => setCurrentCamera(cam)}
                                            >
                                                <div className={`status-dot ${cam.status === 'online' ? 'online' : 'offline'}`} />
                                                <span>{cam.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* AI Capture Gallery (Detailed Detection Cards) */}
                    <div className="sidebar-ai-gallery">
                        <div className="sidebar-ai-gallery-title">
                            <Zap size={12} className={isAiActive ? 'text-yellow-400 animate-pulse' : 'text-gray-500'} />
                            <span>AI ANALYTICS CAPTURES {isAiActive && <span className="text-[10px] text-emerald-400 ml-2">● LIVE</span>}</span>
                        </div>

                        {aiEvents.length === 0 && (
                            <div className="p-8 text-center opacity-30">
                                <Zap size={32} className="mx-auto mb-2" />
                                <p className="text-xs">NO PREVIOUS DATA</p>
                                <p className="text-[10px] mt-1 text-text-tertiary">No AI detection history available for this camera</p>
                            </div>
                        )}

                        {aiEvents.map((event) => (
                            <div key={event.id} className="ai-card animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="ai-card-header">
                                    <div className="ai-card-title-group">
                                        <Radar size={14} className="text-cyan-400" />
                                        <span className="ai-card-title">OBJECT DETECTION</span>
                                    </div>
                                    <span className="ai-card-accuracy">{Math.round((event.metadata?.confidence || event.metadata?.detections?.[0]?.confidence || 0.95) * 100)}%</span>
                                </div>
                                <div className="ai-card-time-row">
                                    <Clock size={10} />
                                    <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="ai-card-body cursor-zoom-in" onClick={() => setSelectedSnapshot(event)}>
                                    <div className="ai-detected-badge">AI {event.metadata?.isFallback ? 'FALLBACK' : 'DETECTED'}</div>
                                    <div className="ai-card-image bg-gray-900/50 flex items-center justify-center overflow-hidden border border-white/5 relative">
                                        {event.metadata?.imageUrl ? (
                                            <img
                                                src={event.metadata.imageUrl}
                                                alt={event.type}
                                                className="w-full h-full object-contain animate-in fade-in duration-700"
                                            />
                                        ) : (
                                            <div className="opacity-20">
                                                <Camera size={32} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                        <div className="absolute bottom-2 left-2 flex gap-1">
                                            {event.metadata?.isRealtime && <span className="text-[8px] bg-red-500/80 px-1 rounded">LIVE</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="ai-card-attributes">
                                    <span className="ai-attributes-label">Detected Objects:</span>
                                    <div className="ai-tag-group">
                                        {(() => {
                                            const metadata = event.metadata || {};
                                            const detections = metadata.detections;
                                            if (Array.isArray(detections) && detections.length > 0) {
                                                const counts = detections.reduce((acc, d) => {
                                                    const cls = d.class || 'unknown';
                                                    acc[cls] = (acc[cls] || 0) + 1;
                                                    return acc;
                                                }, {});
                                                return Object.entries(counts).map(([cls, count]) => (
                                                    <span key={cls} className="ai-tag">{cls} <span className="opacity-70 ml-1">x{count}</span></span>
                                                ));
                                            }
                                            // Fallback
                                            return (metadata.detectedClasses || [event.type?.split('_')[0] || 'object']).map(tag => (
                                                <span key={tag} className="ai-tag">{tag}</span>
                                            ));
                                        })()}
                                        <span className="ai-tag">{event.metadata?.detections?.length || event.metadata?.objectCount || 1} Total</span>
                                    </div>
                                </div>
                                <div className="ai-card-status-bar">
                                    <div className="ai-card-status-fill" style={{ width: `${(event.metadata?.confidence || 0.9) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Snapshot Preview Modal (Lightbox) */}
                    {selectedSnapshot && (
                        <div className="snapshot-lightbox" onClick={() => setSelectedSnapshot(null)}>
                            <div className="lightbox-content animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                                <div className="lightbox-header">
                                    <div className="flex items-center gap-2">
                                        <Radar size={16} className="text-cyan-400" />
                                        <span className="text-xs font-bold tracking-widest leading-none">SNAPSHOT_ANALYSIS</span>
                                    </div>
                                    <button className="lightbox-close" onClick={() => setSelectedSnapshot(null)}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="lightbox-body">
                                    <img src={selectedSnapshot.metadata?.imageUrl} alt="Detection Preview" />

                                    <div className="lightbox-overlay">
                                        <div className="lightbox-meta">
                                            <div className="meta-item">
                                                <span className="meta-label">ID</span>
                                                <span className="meta-value">{selectedSnapshot.id}</span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="meta-label">TIME</span>
                                                <span className="meta-value">{new Date(selectedSnapshot.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="meta-label">SOURCE</span>
                                                <span className="meta-value">{currentCamera.name}</span>
                                            </div>
                                        </div>

                                        <div className="lightbox-tags">
                                            {(() => {
                                                const metadata = selectedSnapshot.metadata || {};
                                                const detections = metadata.detections;
                                                if (Array.isArray(detections) && detections.length > 0) {
                                                    const counts = detections.reduce((acc, d) => {
                                                        const cls = d.class || 'unknown';
                                                        acc[cls] = (acc[cls] || 0) + 1;
                                                        return acc;
                                                    }, {});
                                                    return Object.entries(counts).map(([cls, count]) => (
                                                        <span key={cls} className="tag-pill">{cls.toUpperCase()} x{count}</span>
                                                    ));
                                                }
                                                // Fallback
                                                return metadata.detectedClasses?.map(tag => (
                                                    <span key={tag} className="tag-pill">{tag.toUpperCase()}</span>
                                                ));
                                            })()}
                                            <span className="tag-pill accent">CONFIDENCE: {Math.round((selectedSnapshot.metadata?.confidence || selectedSnapshot.metadata?.detections?.[0]?.confidence || 0.95) * 100)}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="lightbox-footer">
                                    <div className="system-status">
                                        <div className="status-dot animate-pulse"></div>
                                        <span>AI_SUBSYSTEM: NOMINAL</span>
                                    </div>
                                    <div className="scanline"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}


/**
 * Modal form for adding/editing a camera.
 * @param {Object} props
                * @param {Object | null} props.editingCamera - Camera to edit, or null for new
                * @param {Function} props.onClose - Close callback
                * @param {Function} props.onSubmit - Submit callback with (input, isEdit)
                */
export function CameraModal({ editingCamera, onClose, onSubmit }) {
    const [formData, setFormData] = useState(editingCamera ? {
        name: editingCamera.name || '',
        type: editingCamera.type || 'Fixed',
        protocol: editingCamera.protocol || 'RTSP',
        resolution: editingCamera.resolution || '1080p',
        zone: editingCamera.zone || '',
        lat: editingCamera.coordinates?.lat || '',
        lng: editingCamera.coordinates?.lng || '',
        streamUrl: editingCamera.streamUrl || '',
        status: editingCamera.status || 'online'
    } : {
        name: '',
        type: 'Fixed',
        protocol: 'RTSP',
        resolution: '1080p',
        zone: '',
        lat: '',
        lng: '',
        streamUrl: '',
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
            lat: formData.lat ? parseFloat(formData.lat) : null,
            lng: formData.lng ? parseFloat(formData.lng) : null,
            streamUrl: formData.streamUrl,
            status: formData.status
        };
        onSubmit(input, !!editingCamera);
    };

    const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{editingCamera ? 'Edit Camera' : 'Add New Camera'}</h2>
                    <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input className="form-input" placeholder="JL.BARU DEPAN UNDERPASS" value={formData.name} onChange={set('name')} required />
                    </div>
                    <div className="form-grid-2col">
                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <select className="form-input" value={formData.type} onChange={set('type')}>
                                <option value="Fixed">Fixed</option>
                                <option value="PTZ">PTZ</option>
                                <option value="Dome">Dome</option>
                                <option value="Bullet">Bullet</option>
                                <option value="Thermal">Thermal</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Zone</label>
                            <input className="form-input" placeholder="Main Entrance" value={formData.zone} onChange={set('zone')} />
                        </div>
                    </div>
                    <div className="form-grid-2col">
                        <div className="form-group">
                            <label className="form-label">Protocol</label>
                            <select className="form-input" value={formData.protocol} onChange={set('protocol')}>
                                <option value="RTSP">RTSP</option>
                                <option value="ONVIF">ONVIF</option>
                                <option value="RTMP">RTMP</option>
                                <option value="HTTP">HTTP</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Resolution</label>
                            <select className="form-input" value={formData.resolution} onChange={set('resolution')}>
                                <option value="1080p">1080p</option>
                                <option value="4K">4K</option>
                                <option value="720p">720p</option>
                                <option value="4K UHD">4K UHD</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-grid-2col">
                        <div className="form-group">
                            <label className="form-label">Latitude</label>
                            <input className="form-input" type="number" step="any" placeholder="-6.5608970537672535" value={formData.lat} onChange={set('lat')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Longitude</label>
                            <input className="form-input" type="number" step="any" placeholder="106.80475731726231" value={formData.lng} onChange={set('lng')} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Stream URL</label>
                        <input className="form-input" placeholder="https://example.com/stream.m3u8" value={formData.streamUrl} onChange={set('streamUrl')} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-input" value={formData.status} onChange={set('status')}>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingCamera ? 'Update Camera' : 'Add Camera'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
