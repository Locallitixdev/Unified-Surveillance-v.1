import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_MISSIONS, GET_MISSION_TELEMETRY } from '../graphql/missionQueries';
import { Plane, Activity, Clock, Shield } from 'lucide-react';

const MissionView = () => {
    const { loading, error, data } = useQuery(GET_MISSIONS);

    if (loading) return <div className="card">Loading missions...</div>;
    if (error) return <div className="card" style={{ color: 'var(--severity-critical)' }}>Error: {error.message}</div>;

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Mission Intelligence</h1>
            </div>

            <div className="grid-2x2">
                {data?.missions?.map(mission => (
                    <MissionCard key={mission.id} mission={mission} />
                ))}
            </div>
        </div>
    );
};

const MissionCard = ({ mission }) => {
    // Example of using flightId to fetch telemetry for a specific mission
    const { data: telemetryData } = useQuery(GET_MISSION_TELEMETRY, {
        variables: { flightId: mission.id },
        skip: !mission.id
    });

    return (
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div className="kpi-icon indigo">
                        <Shield size={18} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>{mission.name}</h3>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{mission.id}</p>
                    </div>
                </div>
                <span className={`status-badge ${mission.status.toLowerCase()}`}>
                    {mission.status}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} color="var(--text-tertiary)" />
                    <span style={{ fontSize: 'var(--text-sm)' }}>Started: {mission.startTime}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={14} color="var(--text-tertiary)" />
                    <span style={{ fontSize: 'var(--text-sm)' }}>
                        Telemetry: {telemetryData?.missionTelemetry?.length || 0} pts
                    </span>
                </div>
            </div>

            {telemetryData?.missionTelemetry && (
                <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Latest Telemetry</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>ALT: {telemetryData.missionTelemetry[0]?.altitude}m</span>
                        <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>VEL: {telemetryData.missionTelemetry[0]?.velocity}km/h</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MissionView;
