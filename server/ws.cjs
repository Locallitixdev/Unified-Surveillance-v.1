const os = require('os');
const { WebSocketServer } = require('ws');
const { pick, randInt, randFloat, timeAgo, zones, industries } = require('./data/mockData.cjs');
const { query } = require('./db/db.cjs');

function setupWebSocket(server) {
    const wss = new WebSocketServer({ server, path: '/ws' });

    // For real-time CPU tracking
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

    function getMemoryUsage() {
        const total = os.totalmem(), free = os.freemem();
        return Math.round(100 * (1 - free / total));
    }

    const eventTypes = [
        { type: 'person_detected', severity: 'low', desc: 'Person detected in monitored area' },
        { type: 'vehicle_detected', severity: 'low', desc: 'Vehicle detected in zone' },
        { type: 'loitering_detected', severity: 'medium', desc: 'Loitering detected' },
        { type: 'motion_detected', severity: 'low', desc: 'Motion detected' }
    ];

    async function generateLiveEvent() {
        try {
            // Pick a random camera from DB
            const camRes = await query("SELECT id, name, zone, industry FROM cameras WHERE status = 'online' ORDER BY RANDOM() LIMIT 1");
            const cam = camRes.rows[0];

            if (!cam) return null;

            const ev = pick(eventTypes);
            const eventId = `EVT-LIVE-${Date.now()}-${randInt(1000, 9999)}`;
            const timestamp = new Date().toISOString();

            const eventData = {
                id: eventId,
                timestamp,
                source: 'camera',
                sourceId: cam.id,
                type: ev.type,
                severity: ev.severity,
                description: `${ev.desc} at ${cam.name}`,
                industry: cam.industry,
                zone: cam.zone,
                acknowledged: false,
                metadata: { confidence: randFloat(0.85, 0.98), objectCount: randInt(1, 3) }
            };

            // PERSIST to DB
            await query(
                `INSERT INTO events (id, timestamp, source, source_id, type, severity, description, industry, zone, acknowledged, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    eventData.id, eventData.timestamp, eventData.source, eventData.sourceId,
                    eventData.type, eventData.severity, eventData.description,
                    eventData.industry, eventData.zone, eventData.acknowledged, eventData.metadata
                ]
            );

            return { channel: 'event', data: eventData };
        } catch (err) {
            console.error('[WS] Event Gen Error:', err.message);
            return null;
        }
    }

    function generateSensorUpdate() {
        const sensorTypes = ['temperature', 'humidity', 'gas', 'vibration', 'pressure', 'noise'];
        const type = pick(sensorTypes);
        const ranges = { temperature: [15, 80], humidity: [30, 90], gas: [0, 400], vibration: [0, 20], pressure: [1, 9], noise: [40, 110] };
        const units = { temperature: '°C', humidity: '%', gas: 'ppm', vibration: 'mm/s', pressure: 'bar', noise: 'dB' };
        const [min, max] = ranges[type];

        return {
            channel: 'sensor_update',
            data: {
                sensorId: `SNS-${String(randInt(1, 96)).padStart(4, '0')}`,
                type,
                value: randFloat(min, max),
                unit: units[type],
                timestamp: new Date().toISOString()
            }
        };
    }

    wss.on('connection', (ws) => {
        console.log('[WS] Client connected');
        ws.send(JSON.stringify({ channel: 'connected', data: { message: 'Connected to SENTINEL Intelligence Feed', timestamp: new Date().toISOString() } }));

        const eventInterval = setInterval(async () => {
            if (ws.readyState === 1) {
                const ev = await generateLiveEvent();
                if (ev) ws.send(JSON.stringify(ev));
            }
        }, randInt(8000, 15000)); // Slowed down slightly since they are now real and persisted

        const sensorInterval = setInterval(() => {
            if (ws.readyState === 1) ws.send(JSON.stringify(generateSensorUpdate()));
        }, randInt(5000, 10000));

        const healthInterval = setInterval(() => {
            if (ws.readyState === 1) {
                const cpu = getCpuUsage(), mem = getMemoryUsage();
                ws.send(JSON.stringify({
                    channel: 'system_health',
                    data: { timestamp: new Date().toISOString(), cpu, memory: mem, network: { latency: randInt(2, 6) } }
                }));
            }
        }, 2000);

        ws.on('close', () => {
            console.log('[WS] Client disconnected');
            clearInterval(eventInterval);
            clearInterval(sensorInterval);
            clearInterval(healthInterval);
        });
    });

    return wss;
}

module.exports = setupWebSocket;
