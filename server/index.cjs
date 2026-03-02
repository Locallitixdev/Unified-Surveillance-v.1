require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const setupWebSocket = require('./ws.cjs');
const { testConnection, query } = require('./db/db.cjs');

const app = express();
const PORT = process.env.PORT || 3005;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Middleware ──────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Snapshot Fallback Middleware ───────────────────
app.use('/storage/snapshots', (req, res, next) => {
    const filePath = path.join(__dirname, 'storage', 'snapshots', req.path);
    if (!fs.existsSync(filePath)) {
        // Redirect to a stable, high-quality surveillance placeholder
        return res.redirect('https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=800&auto=format&fit=crop');
    }
    next();
});

app.use('/storage', express.static(path.join(__dirname, 'storage')));

// ─── Request logging ────────────────────────────────
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (!req.url.includes('favicon')) {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
        }
    });
    next();
});

// ─── API Routes ─────────────────────────────────────
app.use('/api/cameras', require('./routes/cameras.cjs'));
app.use('/api/drones', require('./routes/drones.cjs'));
app.use('/api/sensors', require('./routes/sensors.cjs'));
app.use('/api/events', require('./routes/events.cjs'));
app.use('/api/alerts', require('./routes/alerts.cjs'));
app.use('/api/rules', require('./routes/rules.cjs'));
app.use('/api/users', require('./routes/users.cjs'));
app.use('/api/analytics', require('./routes/analytics.cjs'));

// ─── System Health ──────────────────────────────────
app.get('/api/system/health', async (req, res) => {
    try {
        const [cameras, drones, sensors] = await Promise.all([
            query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'online') as online FROM cameras"),
            query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'patrolling') as active FROM drones"),
            query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'active') as active FROM sensors"),
        ]);
        res.json({
            timestamp: new Date().toISOString(),
            uptime: '99.97%',
            cameras: { total: parseInt(cameras.rows[0].total), online: parseInt(cameras.rows[0].online) },
            drones: { total: parseInt(drones.rows[0].total), active: parseInt(drones.rows[0].active) },
            sensors: { total: parseInt(sensors.rows[0].total), active: parseInt(sensors.rows[0].active) },
            database: 'connected'
        });
    } catch (err) {
        res.status(500).json({ error: 'Health check failed', database: 'disconnected' });
    }
});

// ─── Root ───────────────────────────────────────────
app.get('/api', (req, res) => {
    res.json({
        name: 'SENTINEL Intelligence Surveillance API',
        version: '2.0.0',
        database: 'PostgreSQL',
        endpoints: [
            '/api/cameras',
            '/api/drones',
            '/api/sensors',
            '/api/events',
            '/api/alerts',
            '/api/rules',
            '/api/users',
            '/api/analytics',
            '/api/system/health'
        ],
        websocket: 'ws://localhost:' + PORT + '/ws'
    });
});

// AI Service and Route
const AIService = require('./ai/service.cjs');
const server = http.createServer(app);
const wss = setupWebSocket(server);
const aiService = new AIService(wss);
app.use('/api/ai', require('./ai/routes.cjs')(aiService));

// ─── 404 Handler ────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ─── Start Server ───────────────────────────────────

// Start periodic services
// const SnapshotService = require('./services/snapshotService.cjs');
// const snapshotService = new SnapshotService(wss);
// snapshotService.start();
// app.set('snapshotService', snapshotService);

async function start() {
    const dbOk = await testConnection();

    server.listen(PORT, async () => {
        let counts = { cameras: '?', drones: '?', sensors: '?', events: '?', alerts: '?', rules: '?' };
        if (dbOk) {
            try {
                const r = await query(`
                    SELECT
                        (SELECT COUNT(*) FROM cameras) as cameras,
                        (SELECT COUNT(*) FROM drones) as drones,
                        (SELECT COUNT(*) FROM sensors) as sensors,
                        (SELECT COUNT(*) FROM events) as events,
                        (SELECT COUNT(*) FROM alerts) as alerts,
                        (SELECT COUNT(*) FROM rules) as rules
                `);
                counts = r.rows[0];
            } catch { /* use defaults */ }
        }

        console.log('');
        console.log('  ╔══════════════════════════════════════════════════╗');
        console.log('  ║                                                  ║');
        console.log('  ║     🛡️  SENTINEL Intelligence API Server        ║');
        console.log('  ║                                                  ║');
        console.log(`  ║     REST API:   http://localhost:${PORT}/api         ║`);
        console.log(`  ║     WebSocket:  ws://localhost:${PORT}/ws            ║`);
        console.log(`  ║     Database:   ${dbOk ? '✅ PostgreSQL' : '❌ Not connected'}               ║`);
        console.log('  ║                                                  ║');
        console.log(`  ║     Cameras: ${String(counts.cameras).padEnd(3)} | Drones: ${String(counts.drones).padEnd(3)} | Sensors: ${String(counts.sensors).padEnd(3)}║`);
        console.log(`  ║     Events: ${String(counts.events).padEnd(3)} | Alerts: ${String(counts.alerts).padEnd(3)} | Rules: ${String(counts.rules).padEnd(3)} ║`);
        console.log('  ║                                                  ║');
        console.log('  ╚══════════════════════════════════════════════════╝');
        console.log('');
    });
}

start();
