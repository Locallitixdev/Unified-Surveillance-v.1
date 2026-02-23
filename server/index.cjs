const express = require('express');
const cors = require('cors');
const http = require('http');
const setupWebSocket = require('./ws.cjs');
const data = require('./data/mockData.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────
app.use(cors());
app.use(express.json());

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
app.get('/api/system/health', (req, res) => {
    res.json(data.systemHealth);
});

// ─── Root ───────────────────────────────────────────
app.get('/api', (req, res) => {
    res.json({
        name: 'SENTINEL Intelligence Surveillance API',
        version: '1.0.0',
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

// ─── 404 Handler ────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ─── Start Server ───────────────────────────────────
const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════════════╗');
    console.log('  ║                                                  ║');
    console.log('  ║     🛡️  SENTINEL Intelligence API Server        ║');
    console.log('  ║                                                  ║');
    console.log(`  ║     REST API:   http://localhost:${PORT}/api         ║`);
    console.log(`  ║     WebSocket:  ws://localhost:${PORT}/ws            ║`);
    console.log('  ║                                                  ║');
    console.log(`  ║     Cameras: ${data.cameras.length}  |  Drones: ${data.drones.length}  |  Sensors: ${data.sensors.length}  ║`);
    console.log(`  ║     Events: ${data.events.length}  |  Alerts: ${data.alerts.length}  |  Rules: ${data.rules.length}    ║`);
    console.log('  ║                                                  ║');
    console.log('  ╚══════════════════════════════════════════════════╝');
    console.log('');
});
