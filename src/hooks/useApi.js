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
                reconnectRef.current = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                ws.close();
            };
        } catch (e) {
            reconnectRef.current = setTimeout(connect, 3000);
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

export function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
