const { WebSocketServer } = require('ws');
const { pick, randInt, randFloat, timeAgo, zones, industries } = require('./data/mockData.cjs');

function setupWebSocket(server) {
    const wss = new WebSocketServer({ server, path: '/ws' });

    const eventTypes = [
        { type: 'person_detected', severity: 'low', desc: 'Person detected in monitored area' },
        { type: 'vehicle_detected', severity: 'low', desc: 'Vehicle detected in zone' },
        { type: 'intrusion_detected', severity: 'critical', desc: 'Unauthorized entry detected' },
        { type: 'ppe_violation', severity: 'high', desc: 'PPE violation — hard hat missing' },
        { type: 'loitering_detected', severity: 'medium', desc: 'Loitering detected' },
        { type: 'crowd_threshold', severity: 'medium', desc: 'Crowd density exceeded limit' },
        { type: 'motion_detected', severity: 'low', desc: 'Motion detected by sensor' },
        { type: 'temperature_alert', severity: 'medium', desc: 'Temperature exceeded threshold' },
        { type: 'gas_leak', severity: 'critical', desc: 'Gas concentration above safe level' },
        { type: 'fire_detected', severity: 'critical', desc: 'Fire/smoke detected' }
    ];

    function generateLiveEvent() {
        const ev = pick(eventTypes);
        const ind = pick(industries);
        const src = pick(['camera', 'camera', 'camera', 'drone', 'sensor']);
        const sourceId = src === 'camera'
            ? `CAM-${String(randInt(1, 64)).padStart(4, '0')}`
            : src === 'drone'
                ? `DRN-${String(randInt(1, 12)).padStart(3, '0')}`
                : `SNS-${String(randInt(1, 96)).padStart(4, '0')}`;

        return {
            channel: 'event',
            data: {
                id: `EVT-LIVE-${Date.now()}-${randInt(1000, 9999)}`,
                timestamp: new Date().toISOString(),
                source: src,
                sourceId,
                type: ev.type,
                severity: ev.severity,
                description: ev.desc,
                industry: ind,
                zone: pick(zones[ind]),
                acknowledged: false,
                metadata: {
                    confidence: randFloat(0.75, 0.99),
                    objectCount: randInt(1, 4)
                }
            }
        };
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

    function generateAlertUpdate() {
        const severities = ['critical', 'high', 'medium'];
        const sev = pick(severities);
        const ind = pick(industries);
        const titles = [
            'Perimeter Breach — Sector 7',
            'PPE Violation — Zone B',
            'Gas Leak Warning',
            'Unauthorized Access',
            'Fire Alarm Triggered',
            'Drone Signal Lost',
            'Equipment Tampering',
            'Crowd Overcapacity'
        ];

        return {
            channel: 'alert',
            data: {
                id: `ALT-LIVE-${Date.now()}`,
                timestamp: new Date().toISOString(),
                severity: sev,
                title: pick(titles),
                description: `Real-time alert. Confidence: ${randFloat(0.85, 0.99)}`,
                industry: ind,
                zone: pick(zones[ind]),
                status: 'active'
            }
        };
    }

    wss.on('connection', (ws) => {
        console.log('[WS] Client connected');

        ws.send(JSON.stringify({ channel: 'connected', data: { message: 'Connected to SENTINEL Intelligence Feed', timestamp: new Date().toISOString() } }));

        // Send events every 2-5 seconds
        const eventInterval = setInterval(() => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify(generateLiveEvent()));
            }
        }, randInt(2000, 5000));

        // Send sensor updates every 3-8 seconds
        const sensorInterval = setInterval(() => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify(generateSensorUpdate()));
            }
        }, randInt(3000, 8000));

        // Send alerts every 10-30 seconds
        const alertInterval = setInterval(() => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify(generateAlertUpdate()));
            }
        }, randInt(10000, 30000));

        // System health every 15 seconds
        const healthInterval = setInterval(() => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({
                    channel: 'system_health',
                    data: {
                        timestamp: new Date().toISOString(),
                        cpu: randFloat(20, 65),
                        memory: randFloat(40, 75),
                        network: { latency: randInt(2, 15) },
                        aiEngine: { inferenceRate: randInt(20, 60), gpuUtil: randFloat(40, 85) }
                    }
                }));
            }
        }, 15000);

        ws.on('close', () => {
            console.log('[WS] Client disconnected');
            clearInterval(eventInterval);
            clearInterval(sensorInterval);
            clearInterval(alertInterval);
            clearInterval(healthInterval);
        });
    });

    return wss;
}

module.exports = setupWebSocket;
