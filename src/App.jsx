import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import Cameras from './pages/Cameras';
import Drones from './pages/Drones';
import Sensors from './pages/Sensors';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { useWebSocket, useApi } from './hooks/useApi';
import { useQuery } from '@apollo/client';
import { GET_ALERTS, GET_ANALYTICS_SUMMARY } from './graphql/dashboardQueries';

function AppContent() {
    const ws = useWebSocket();
    const { data: qAlerts } = useQuery(GET_ALERTS, { variables: { status: 'active' } });
    const { data: qSummary } = useQuery(GET_ANALYTICS_SUMMARY, { pollInterval: 30000 });

    const [alertCounts, setAlertCounts] = useState({ critical: 0, high: 0, medium: 0 });

    useEffect(() => {
        if (qAlerts?.alerts) {
            const active = qAlerts.alerts;
            setAlertCounts({
                critical: active.filter(a => a.severity === 'critical').length,
                high: active.filter(a => a.severity === 'high').length,
                medium: active.filter(a => a.severity === 'medium').length
            });
        }
    }, [qAlerts]);

    // Increment counts from live alerts
    useEffect(() => {
        if (ws.alerts.length > 0) {
            const latest = ws.alerts[0];
            if (latest.severity === 'critical' || latest.severity === 'high' || latest.severity === 'medium') {
                setAlertCounts(prev => ({
                    ...prev,
                    [latest.severity]: prev[latest.severity] + 1
                }));
            }
        }
    }, [ws.alerts]);

    const systemHealth = ws.systemHealth || qSummary?.analyticsSummary;

    return (
        <>
            <Header systemHealth={systemHealth} alertCounts={alertCounts} connected={ws.connected} />
            <div className="app-layout">
                <Sidebar alertCount={alertCounts.critical} />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard ws={ws} />} />
                        <Route path="/map" element={<MapView />} />
                        <Route path="/cameras" element={<Cameras />} />
                        <Route path="/drones" element={<Drones />} />
                        <Route path="/sensors" element={<Sensors ws={ws} />} />
                        <Route path="/alerts" element={<Alerts ws={ws} />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </main>
            </div>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
