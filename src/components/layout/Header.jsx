import { useState, useEffect } from 'react';
import { Shield, Bell, Wifi, WifiOff, Clock, ChevronDown } from 'lucide-react';

export default function Header({ systemHealth, alertCounts, connected }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <header className="header">
            <div className="header-left">
                <div className="header-logo">
                    <Shield size={22} />
                    <span>SENTINEL</span>
                </div>
                <div className="header-divider" />
                <div className="header-status">
                    <div className="header-status-item">
                        <div className={`status-dot ${connected ? 'online' : 'error'}`} />
                        <span className="value">{connected ? 'LIVE' : 'OFFLINE'}</span>
                    </div>
                    {systemHealth && (
                        <>
                            <div className="header-status-item">
                                <span className="label">CPU</span>
                                <span className="value">{systemHealth.cpu?.toFixed(1) || '--'}%</span>
                            </div>
                            <div className="header-status-item">
                                <span className="label">MEM</span>
                                <span className="value">{systemHealth.memory?.toFixed(1) || '--'}%</span>
                            </div>
                            <div className="header-status-item">
                                <span className="label">AI</span>
                                <span className="value" style={{ color: '#22d3ee' }}>{systemHealth.aiEngine?.inferenceRate || '--'} fps</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="header-right">
                <div className="header-alerts-summary">
                    {alertCounts.critical > 0 && (
                        <span className="alert-badge critical">
                            <Bell size={11} /> {alertCounts.critical}
                        </span>
                    )}
                    {alertCounts.high > 0 && (
                        <span className="alert-badge high">
                            {alertCounts.high}
                        </span>
                    )}
                    {alertCounts.medium > 0 && (
                        <span className="alert-badge medium">
                            {alertCounts.medium}
                        </span>
                    )}
                </div>

                <div className="header-divider" />

                <div className="header-clock">
                    <div style={{ fontWeight: 600 }}>{timeStr}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{dateStr}</div>
                </div>

                <div className="header-user">
                    <div className="header-user-avatar">SA</div>
                    <div className="header-user-info">
                        <span className="header-user-name">Admin</span>
                        <span className="header-user-role">Administrator</span>
                    </div>
                    <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
                </div>
            </div>
        </header>
    );
}
