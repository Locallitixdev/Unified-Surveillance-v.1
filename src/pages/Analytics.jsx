import { useQuery } from '@apollo/client';
import { GET_ANALYTICS, GET_ANALYTICS_SUMMARY } from '../graphql/dashboardQueries';
import { BarChart3, TrendingUp, PieChart, Clock, Calendar, Target, Zap, Shield } from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#22d3ee', '#a78bfa', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#6366f1'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
        <div style={{ background: '#1c2641', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <span>{p.name}:</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{p.value}</span>
                </div>
            ))}
        </div>
    );
};

export default function Analytics() {
    const { data: qAnalytics } = useQuery(GET_ANALYTICS);
    const { data: qSummary } = useQuery(GET_ANALYTICS_SUMMARY);

    const summary = qSummary?.analyticsSummary || {};
    const analytics = qAnalytics?.analytics || {};
    const hourly = analytics.hourly || [];
    const daily = analytics.daily || [];
    const byType = analytics.byType || [];
    const bySeverity = analytics.bySeverity || [];

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics & Reports</h1>
                    <p className="page-subtitle">Detection trends, incident analysis, and executive summary</p>
                </div>
                <div className="filter-bar">
                    <select className="filter-select" defaultValue="7d">
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>
            </div>

            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <KPI icon={Target} color="cyan" value={summary.totalDetections?.toLocaleString() || '0'} label="Total Detections" />
                <KPI icon={Zap} color="amber" value={summary.totalAlerts || 0} label="Total Alerts" />
                <KPI icon={Shield} color="rose" value={summary.criticalAlerts || 0} label="Critical" style={{ color: 'var(--severity-critical)' }} />
                <KPI icon={Clock} color="emerald" value={`${summary.avgResponseTime || 0}s`} label="Avg Response" />
            </div>

            <div className="two-col-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                <ChartCard title="Hourly Activity" icon={TrendingUp}>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={hourly}>
                            <defs>
                                <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="detections" stroke="#22d3ee" fill="url(#gD)" name="Detections" />
                            <Area type="monotone" dataKey="alerts" stroke="#f59e0b" fill="url(#gA)" name="Alerts" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Daily Trends" icon={Calendar}>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={daily}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="totalDetections" fill="#6366f1" name="Detections" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="totalAlerts" fill="#22d3ee" name="Alerts" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="two-col-grid">
                <ChartCard title="Detections by Type" icon={BarChart3}>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={byType} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="type" width={120} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                                {byType.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Alerts by Severity" icon={PieChart}>
                    <ResponsiveContainer width="100%" height={250}>
                        <RePieChart>
                            <Pie data={bySeverity} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="count" nameKey="severity">
                                {bySeverity.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Legend verticalAlign="bottom" formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{v}</span>} />
                            <Tooltip content={<CustomTooltip />} />
                        </RePieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

function KPI({ icon: Icon, color, value, label, style }) {
    return (
        <div className="kpi-card">
            <div className={`kpi-icon ${color}`}><Icon size={20} /></div>
            <div className="kpi-content">
                <div className="kpi-value" style={style}>{value}</div>
                <div className="kpi-label">{label}</div>
            </div>
        </div>
    );
}

function ChartCard({ title, icon: Icon, children }) {
    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title"><Icon size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />{title}</span>
            </div>
            {children}
        </div>
    );
}
