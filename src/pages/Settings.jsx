import { useState } from 'react';
import { useApi, formatTimeAgo } from '../hooks/useApi';
import { Settings as SettingsIcon, Users, Shield, BookOpen, Bell, Database, Cpu, Clock } from 'lucide-react';

export default function Settings() {
    const { data: usersData } = useApi('/users');
    const { data: rulesData } = useApi('/rules');
    const [activeTab, setActiveTab] = useState('users');

    const users = usersData?.data || [];
    const rules = rulesData?.data || [];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">System configuration, user management, and rule engine</p>
                </div>
            </div>

            <div className="tabs">
                {[
                    { id: 'users', label: 'Users', icon: Users },
                    { id: 'rules', label: 'Rule Engine', icon: Shield },
                    { id: 'audit', label: 'Audit Log', icon: BookOpen },
                    { id: 'system', label: 'System', icon: Cpu }
                ].map(tab => (
                    <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        <tab.icon size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'users' && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">User Management</span>
                        <button className="btn btn-primary btn-sm">+ Add User</button>
                    </div>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th></tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td className="id-cell">{user.id}</td>
                                        <td style={{ fontWeight: 500 }}>{user.fullName}</td>
                                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{user.email}</td>
                                        <td><RoleBadge role={user.role} /></td>
                                        <td><span className={`status-badge ${user.status}`}><span className="status-badge-dot" />{user.status}</span></td>
                                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{formatTimeAgo(user.lastLogin)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'rules' && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Rule Engine Configuration</span>
                        <button className="btn btn-primary btn-sm">+ New Rule</button>
                    </div>
                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr><th>ID</th><th>Rule Name</th><th>Severity</th><th>Industry</th><th>Actions</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {rules.map(rule => (
                                    <tr key={rule.id}>
                                        <td className="id-cell">{rule.id}</td>
                                        <td style={{ fontWeight: 500 }}>{rule.name}</td>
                                        <td><span className={`severity-badge ${rule.severity}`}>{rule.severity}</span></td>
                                        <td style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{rule.industry.replace('_', ' & ')}</td>
                                        <td style={{ fontSize: 'var(--text-xs)' }}>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {rule.actions.map((a, i) => (
                                                    <span key={i} style={{ padding: '1px 6px', background: 'var(--bg-tertiary)', borderRadius: '3px', fontSize: '10px' }}>{a}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`toggle-switch ${rule.enabled ? 'active' : ''}`} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'audit' && (
                <div className="card">
                    <div className="card-header"><span className="card-title">Audit Trail</span></div>
                    <AuditLog />
                </div>
            )}

            {activeTab === 'system' && <SystemSettings />}
        </div>
    );
}

function RoleBadge({ role }) {
    const colors = { admin: 'var(--accent-rose)', operator: 'var(--accent-cyan)', viewer: 'var(--text-tertiary)' };
    return (
        <span style={{
            padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.5px',
            background: `${colors[role]}15`, color: colors[role], border: `1px solid ${colors[role]}30`
        }}>
            {role}
        </span>
    );
}

function AuditLog() {
    const logs = [
        { time: '2 min ago', user: 'admin', action: 'Acknowledged alert ALT-00003', type: 'alert' },
        { time: '15 min ago', user: 'j.mitchell', action: 'Modified rule RUL-005 threshold', type: 'rule' },
        { time: '1 hr ago', user: 's.chen', action: 'Added camera CAM-0065', type: 'device' },
        { time: '2 hrs ago', user: 'admin', action: 'Updated user r.kumar role to operator', type: 'user' },
        { time: '3 hrs ago', user: 'd.okonkwo', action: 'Resolved alert ALT-00012', type: 'alert' },
        { time: '5 hrs ago', user: 'admin', action: 'System backup completed', type: 'system' },
        { time: '8 hrs ago', user: 'm.santos', action: 'Started drone DRN-004 patrol mission', type: 'device' },
        { time: '12 hrs ago', user: 'admin', action: 'Updated data retention policy to 90 days', type: 'system' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-sm)' }}>
                    <Clock size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: '80px' }}>{log.time}</span>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent-cyan)', minWidth: '90px' }}>{log.user}</span>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{log.action}</span>
                </div>
            ))}
        </div>
    );
}

function SystemSettings() {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
            <div className="card">
                <div className="card-header"><span className="card-title"><Database size={14} style={{ marginRight: '6px' }} />Data Retention</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <SettingRow label="Event data retention" value="90 days" />
                    <SettingRow label="Video recording retention" value="30 days" />
                    <SettingRow label="Alert history retention" value="365 days" />
                    <SettingRow label="Audit log retention" value="730 days" />
                </div>
            </div>
            <div className="card">
                <div className="card-header"><span className="card-title"><Bell size={14} style={{ marginRight: '6px' }} />Notifications</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <ToggleRow label="Email notifications" active={true} />
                    <ToggleRow label="SMS alerts (critical)" active={true} />
                    <ToggleRow label="Webhook integration" active={false} />
                    <ToggleRow label="Push notifications" active={true} />
                </div>
            </div>
        </div>
    );
}

function SettingRow({ label, value }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) 0' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{value}</span>
        </div>
    );
}

function ToggleRow({ label, active: initialActive }) {
    const [active, setActive] = useState(initialActive);
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) 0' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{label}</span>
            <div className={`toggle-switch ${active ? 'active' : ''}`} onClick={() => setActive(!active)} />
        </div>
    );
}
