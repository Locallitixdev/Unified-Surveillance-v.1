import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = '/api';

export function useApi(endpoint, options = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}${endpoint}`);
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const json = await res.json();
            setData(json);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        fetchData();
        if (options.refetchInterval) {
            const interval = setInterval(fetchData, options.refetchInterval);
            return () => clearInterval(interval);
        }
    }, [fetchData, options.refetchInterval]);

    return { data, loading, error, refetch: fetchData };
}

export function useWebSocket() {
    const [events, setEvents] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [sensorUpdates, setSensorUpdates] = useState([]);
    const [systemHealth, setSystemHealth] = useState(null);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectRef = useRef(null);

    const connect = useCallback(() => {
        const isMockMode = import.meta.env.VITE_MOCK_WS === 'true';
        if (isMockMode) {
            console.log('[WebSocket] Mock Mode: Skipping live connection. Set VITE_MOCK_WS=false to enable.');
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                if (reconnectRef.current) {
                    clearTimeout(reconnectRef.current);
                    reconnectRef.current = null;
                }
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    switch (msg.channel) {
                        case 'event':
                            setEvents(prev => [msg.data, ...prev].slice(0, 100));
                            break;
                        case 'alert':
                            setAlerts(prev => [msg.data, ...prev].slice(0, 50));
                            break;
                        case 'sensor_update':
                            setSensorUpdates(prev => [msg.data, ...prev].slice(0, 50));
                            break;
                        case 'system_health':
                            setSystemHealth(msg.data);
                            break;
                    }
                } catch (e) { /* ignore parse errors */ }
            };

            ws.onclose = () => {
                setConnected(false);
                // Slow down retries to prevent log spam if backend is missing
                reconnectRef.current = setTimeout(connect, 10000);
            };

            ws.onerror = () => {
                // Silently close on error to avoid proxy spam in console
                ws.close();
            };
        } catch (e) {
            reconnectRef.current = setTimeout(connect, 10000);
        }
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
        };
    }, [connect]);

    return { events, alerts, sensorUpdates, systemHealth, connected };
}

// Re-exported for backward compatibility — prefer importing from '../utils/formatters' directly
export { formatTimeAgo, formatTime } from '../utils/formatters';

