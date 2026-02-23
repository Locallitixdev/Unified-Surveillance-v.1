import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Camera, Map, Bell, BarChart3, Settings,
    Radio, Cpu, Plane, Shield
} from 'lucide-react';

const navItems = [
    { group: 'Overview' },
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/map', icon: Map, label: 'Map View' },
    { group: 'Monitoring' },
    { to: '/cameras', icon: Camera, label: 'Cameras', badge: null },
    { to: '/drones', icon: Plane, label: 'Drones' },
    { to: '/sensors', icon: Radio, label: 'IoT Sensors' },
    { group: 'Intelligence' },
    { to: '/alerts', icon: Bell, label: 'Alerts', badgeKey: 'alerts' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { group: 'System' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ alertCount }) {
    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                {navItems.map((item, i) => {
                    if (item.group) {
                        return <div key={i} className="sidebar-group-title">{item.group}</div>;
                    }
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                            {item.badgeKey === 'alerts' && alertCount > 0 && (
                                <span className="badge">{alertCount}</span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>
            <div className="sidebar-footer">
                <div className="sidebar-footer-info">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Shield size={12} style={{ color: 'var(--accent-indigo)' }} />
                        <span style={{ fontWeight: 600, fontSize: '11px' }}>SENTINEL v2.0</span>
                    </div>
                    <div className="version">Intelligence Surveillance Platform</div>
                </div>
            </div>
        </aside>
    );
}
