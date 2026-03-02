import { useState, useEffect, useRef } from 'react';
import { Camera, Plane, Radio, Activity, Map, Maximize2 } from 'lucide-react';
import { formatTimeAgo } from '../utils/formatters';
import HLSPlayer from './HLSPlayer';

/**
 * Captures a frame from a video stream to use as a snapshot.
 */
export function StreamSnapshot({ url, camera, onCapture }) {
    const playerRef = useRef(null);
    const canvasRef = useRef(null);
    const [snapshot, setSnapshot] = useState(null);

    useEffect(() => {
        let timeout;
        const video = playerRef.current;
        if (!video || !url) return;

        const capture = () => {
            const canvas = canvasRef.current;
            if (!canvas || !video) return;

            // Wait a bit for the first frame to actually show up
            timeout = setTimeout(() => {
                try {
                    const ctx = canvas.getContext('2d');
                    canvas.width = 600;
                    canvas.height = 338; // 16:9
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    setSnapshot(dataUrl);
                    if (onCapture) onCapture(dataUrl);
                } catch (err) {
                    console.error("[StreamSnapshot] Capture failed:", err);
                }
            }, 2000); // 2 seconds to ensure some video buffer
        };

        video.addEventListener('playing', capture);
        return () => {
            if (timeout) clearTimeout(timeout);
            video.removeEventListener('playing', capture);
        };
    }, [url]);

    if (snapshot) {
        return <img src={snapshot} alt="Stream Snapshot" className="snapshot-image" />;
    }

    return (
        <div className="stream-capture-wrapper">
            <HLSPlayer
                ref={playerRef}
                url={url}
                autoPlay={true}
                muted={true}
                controls={false}
                className="hidden-capture-video"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="snapshot-loading">
                <div className="spinner-small" />
            </div>
        </div>
    );
}

/**
 * Single camera video tile for the dashboard grid.
 */
export function VideoTile({ camera, isLiveAll, snapshotUrl }) {
    const [timestamp, setTimestamp] = useState(new Date());
    const [isLive, setIsLive] = useState(isLiveAll);

    // Sync with global "Live All" toggle
    useEffect(() => {
        setIsLive(isLiveAll);
    }, [isLiveAll]);

    useEffect(() => {
        const t = setInterval(() => setTimestamp(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const isOffline = camera.status === 'offline';

    return (
        <div className="cctv-card">
            <div className="cctv-thumbnail-wrapper">
                {camera.streamUrl && !isOffline && isLive ? (
                    <HLSPlayer url={camera.streamUrl} className="cctv-thumbnail" autoPlay={true} />
                ) : (
                    <div className="cctv-thumbnail snapshot-mode">
                        {!isOffline && camera.streamUrl && (
                            <StreamSnapshot url={camera.streamUrl} camera={camera} />
                        )}

                        {isOffline && (
                            <div className="video-offline-overlay">
                                <Camera size={18} />
                                <span>Signal Lost</span>
                            </div>
                        )}

                        {!isOffline && (
                            <div className="cctv-play-overlay" onClick={() => setIsLive(true)}>
                                <div className="play-icon-circle">
                                    <Radio size={20} className={isLive && !isLiveAll ? 'pulse' : ''} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isOffline && (
                    <div className="video-offline-overlay">
                        <Camera size={18} />
                        <span>Signal Lost</span>
                    </div>
                )}

                <div className="cctv-badge-overlay top-left">
                    <div className={`status-dot ${isOffline ? 'offline' : 'online'}`} />
                </div>

                <div className="cctv-badge-overlay bottom-right">
                    <span className="res-badge">{camera.resolution}</span>
                </div>
            </div>

            <div className="cctv-card-info">
                <div className="cctv-card-footer">
                    <div className="cctv-title-group">
                        <span className="cctv-location-name">{camera.name}</span>
                    </div>
                    <div className="cctv-actions">
                        <Map size={14} className="action-icon" />
                        <Maximize2 size={14} className="action-icon" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Single event row in the event timeline sidebar.
 */
export function EventItem({ event, isNew }) {
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
