import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const HLSPlayer = ({ url, autoPlay = true, className = '' }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls;

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (autoPlay) {
                    video.play().catch(err => console.error("Error playing HLS:", err));
                }
            });
        }
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native support (e.g. Safari)
            video.src = url;
            video.addEventListener('loadedmetadata', () => {
                if (autoPlay) {
                    video.play().catch(err => console.error("Error playing native HLS:", err));
                }
            });
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [url, autoPlay]);

    return (
        <video
            ref={videoRef}
            controls
            autoPlay={autoPlay}
            muted
            playsInline
            className={`hls-player ${className}`}
            style={{ width: '100%', height: 'auto', borderRadius: '8px', backgroundColor: '#000' }}
        />
    );
};

export default HLSPlayer;
