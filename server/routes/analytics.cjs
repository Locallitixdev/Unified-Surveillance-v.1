const express = require('express');
const router = express.Router();
const { query } = require('../db/db.cjs');

router.get('/', async (req, res) => {
    try {
        const [hourly, daily, byType, bySeverity] = await Promise.all([
            query('SELECT * FROM analytics_hourly ORDER BY hour'),
            query('SELECT * FROM analytics_daily ORDER BY date'),
            query('SELECT * FROM analytics_by_type ORDER BY count DESC'),
            query('SELECT * FROM analytics_by_severity ORDER BY count DESC'),
        ]);

        res.json({
            hourly: hourly.rows,
            daily: daily.rows.map(d => ({
                date: d.date,
                label: d.label,
                totalDetections: d.total_detections,
                totalAlerts: d.total_alerts,
                avgResponseTime: d.avg_response_time,
                criticalIncidents: d.critical_incidents
            })),
            byType: byType.rows,
            bySeverity: bySeverity.rows
        });
    } catch (err) {
        console.error('[analytics] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const os = require('os');

// Helper for CPU usage calculation
let lastCpuTimes = os.cpus().map(c => c.times);
function getCpuUsage() {
    const currentCpuTimes = os.cpus().map(c => c.times);
    let idleDiff = 0, totalDiff = 0;
    for (let i = 0; i < currentCpuTimes.length; i++) {
        const start = lastCpuTimes[i], end = currentCpuTimes[i];
        if (!start || !end) continue;
        const startTotal = Object.values(start).reduce((a, b) => a + b, 0);
        const endTotal = Object.values(end).reduce((a, b) => a + b, 0);
        idleDiff += (end.idle - start.idle);
        totalDiff += (endTotal - startTotal);
    }
    lastCpuTimes = currentCpuTimes;
    return totalDiff === 0 ? 0 : Math.max(0, Math.min(100, 100 * (1 - idleDiff / totalDiff)));
}

router.get('/summary', async (req, res) => {
    try {
        const [detections, alerts, cameras, drones, sensors, daily] = await Promise.all([
            query('SELECT COALESCE(SUM(count), 0) as total FROM analytics_by_type'),
            query("SELECT COUNT(*) FROM alerts WHERE severity = 'critical' AND status = 'active'"),
            query("SELECT COUNT(*) FROM cameras WHERE status = 'online'"),
            query("SELECT COUNT(*) FROM drones WHERE status = 'patrolling'"),
            query("SELECT COUNT(*) FROM sensors WHERE status = 'active'"),
            query('SELECT COALESCE(AVG(avg_response_time), 0) as avg FROM analytics_daily'),
        ]);

        const total = os.totalmem();
        const free = os.freemem();

        res.json({
            totalDetections: parseInt(detections.rows[0].total),
            criticalAlerts: parseInt(alerts.rows[0].count),
            camerasOnline: parseInt(cameras.rows[0].count),
            dronesActive: parseInt(drones.rows[0].count),
            sensorsActive: parseInt(sensors.rows[0].count),
            avgResponseTime: Math.round(parseFloat(daily.rows[0].avg)),
            systemUptime: '99.97%',
            // Add CPU and MEM for fallback
            cpu: getCpuUsage(),
            memory: Math.round(100 * (1 - free / total))
        });
    } catch (err) {
        console.error('[analytics] Summary error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
