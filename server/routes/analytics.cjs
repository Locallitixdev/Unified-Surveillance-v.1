const express = require('express');
const router = express.Router();
const data = require('../data/mockData.cjs');

router.get('/', (req, res) => {
    res.json(data.analytics);
});

router.get('/summary', (req, res) => {
    const totalDetections = data.analytics.byType.reduce((sum, t) => sum + t.count, 0);
    const totalAlerts = data.analytics.bySeverity.reduce((sum, s) => sum + s.count, 0);
    const criticalAlerts = data.alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
    const avgResponseTime = data.analytics.daily.reduce((sum, d) => sum + d.avgResponseTime, 0) / data.analytics.daily.length;

    res.json({
        totalDetections,
        totalAlerts,
        criticalAlerts,
        avgResponseTime: Math.round(avgResponseTime),
        camerasOnline: data.cameras.filter(c => c.status === 'online').length,
        dronesActive: data.drones.filter(d => d.status === 'patrolling').length,
        sensorsActive: data.sensors.filter(s => s.status === 'active').length,
        systemUptime: data.systemHealth.uptime
    });
});

module.exports = router;
