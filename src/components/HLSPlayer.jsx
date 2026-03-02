import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Hls from 'hls.js';

const HLSPlayer = forwardRef(({ url, autoPlay = true, className = '', height = 'auto', muted = true, controls = true }, ref) => {
    const internalVideoRef = useRef(null);

    // Expose the internal video element to the parent ref
    useImperativeHandle(ref, () => internalVideoRef.current);

    useEffect(() => {
        const video = internalVideoRef.current;
        if (!video || !url) return;

        let hls;

        const startPlayback = () => {
            if (autoPlay) {
                video.play().catch(err => {
                    // Muted autoplay usually works, but log if it fails
                    console.warn("[HLSPlayer] Playback failed:", err.message);
                });
            }
        };

        if (Hls.isSupported()) {
            hls = new Hls({
                capLevelToPlayerSize: true,
                autoStartLoad: true
            });
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, startPlayback);
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            });
        }
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.addEventListener('loadedmetadata', startPlayback);
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [url, autoPlay]);

    // Expose capture method via ref if needed, or just let parent use ref.current
    return (
        <video
            ref={internalVideoRef}
            controls={controls}
            muted={muted}
            autoPlay={autoPlay}
            playsInline
            className={`hls-player ${className}`}
            style={{ width: '100%', height, borderRadius: '8px', backgroundColor: '#000', objectFit: 'cover' }}
        />
    );
});

export default HLSPlayer;
