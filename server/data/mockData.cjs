const { v4: uuidv4 } = require('uuid');

// ─── Helpers ────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dec = 2) => +(Math.random() * (max - min) + min).toFixed(dec);
const timeAgo = (minMs, maxMs) => new Date(Date.now() - randInt(minMs, maxMs)).toISOString();

// ─── Industries & Zones ─────────────────────────────────
const industries = ['oil_gas', 'warehouse', 'smart_city'];
const zones = {
    oil_gas: ['Rig Platform A', 'Rig Platform B', 'Pipeline Sector 7', 'Refinery East', 'Hazmat Storage', 'Perimeter North', 'Helipad Zone', 'Tank Farm'],
    warehouse: ['Loading Dock A', 'Loading Dock B', 'Storage Bay 1', 'Storage Bay 2', 'Assembly Line', 'Office Wing', 'Parking Lot', 'Cold Storage'],
    smart_city: ['Downtown Core', 'Transit Hub', 'Park District', 'Highway I-90', 'Shopping Mall', 'Stadium Area', 'Residential Block 5', 'Industrial Zone']
};

// ─── Coordinates (center points per industry) ───────────
const centers = {
    oil_gas: { lat: 1.35, lng: 103.82 },
    warehouse: { lat: 1.34, lng: 103.84 },
    smart_city: { lat: 1.36, lng: 103.85 }
};
const jitter = (center, range = 0.02) => ({
    lat: +(center.lat + (Math.random() - 0.5) * range).toFixed(6),
    lng: +(center.lng + (Math.random() - 0.5) * range).toFixed(6)
});

// ═══════════════════════════════════════════════════════
// CAMERAS
// ═══════════════════════════════════════════════════════
function generateCameras(count = 64) {
    const types = ['PTZ', 'Fixed', 'Dome', 'Bullet', 'Thermal'];
    const protocols = ['RTSP', 'ONVIF', 'RTMP'];
    const resolutions = ['1080p', '4K', '720p', '4K UHD'];
    const statuses = ['online', 'online', 'online', 'online', 'offline', 'maintenance'];

    return Array.from({ length: count }, (_, i) => {
        const ind = pick(industries);
        const coords = jitter(centers[ind]);
        return {
            id: `CAM-${String(i + 1).padStart(4, '0')}`,
            name: `${pick(zones[ind])} Cam ${i + 1}`,
            industry: ind,
            zone: pick(zones[ind]),
            type: pick(types),
            protocol: pick(protocols),
            resolution: pick(resolutions),
            status: pick(statuses),
            coordinates: coords,
            ip: `192.168.${randInt(1, 254)}.${randInt(1, 254)}`,
            port: pick([554, 8554, 80]),
            streamUrl: `rtsp://192.168.${randInt(1, 254)}.${randInt(1, 254)}:554/stream${i + 1}`,
            lastDetection: timeAgo(0, 3600000),
            fps: pick([15, 25, 30]),
            recording: Math.random() > 0.1,
            nightVision: Math.random() > 0.3,
            createdAt: timeAgo(86400000 * 30, 86400000 * 365)
        };
    });
}

// ═══════════════════════════════════════════════════════
// DRONES
// ═══════════════════════════════════════════════════════
function generateDrones(count = 12) {
    const models = ['DJI Matrice 350', 'DJI Mavic 3E', 'Skydio X10', 'Autel EVO Max', 'Parrot ANAFI AI'];
    const statuses = ['patrolling', 'patrolling', 'docked', 'returning', 'charging', 'maintenance'];

    return Array.from({ length: count }, (_, i) => {
        const ind = pick(industries);
        const coords = jitter(centers[ind], 0.03);
        return {
            id: `DRN-${String(i + 1).padStart(3, '0')}`,
            name: `${pick(['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'])} ${i + 1}`,
            model: pick(models),
            industry: ind,
            assignedZone: pick(zones[ind]),
            status: pick(statuses),
            coordinates: coords,
            altitude: randInt(30, 120),
            battery: randInt(15, 100),
            speed: randFloat(0, 45, 1),
            flightTime: randInt(5, 35),
            streamUrl: `rtsp://drone${i + 1}.local:8554/live`,
            patrolRoute: Array.from({ length: randInt(4, 8) }, () => jitter(centers[ind], 0.025)),
            lastMission: timeAgo(0, 86400000),
            createdAt: timeAgo(86400000 * 30, 86400000 * 180)
        };
    });
}

// ═══════════════════════════════════════════════════════
// SENSORS
// ═══════════════════════════════════════════════════════
function generateSensors(count = 96) {
    const sensorTypes = [
        { type: 'temperature', unit: '°C', min: -10, max: 85, threshold: 60 },
        { type: 'humidity', unit: '%', min: 20, max: 95, threshold: 85 },
        { type: 'gas', unit: 'ppm', min: 0, max: 500, threshold: 200 },
        { type: 'vibration', unit: 'mm/s', min: 0, max: 25, threshold: 15 },
        { type: 'motion', unit: 'events', min: 0, max: 1, threshold: 1 },
        { type: 'door', unit: 'state', min: 0, max: 1, threshold: 1 },
        { type: 'smoke', unit: 'ppm', min: 0, max: 100, threshold: 30 },
        { type: 'pressure', unit: 'bar', min: 0, max: 10, threshold: 8 },
        { type: 'noise', unit: 'dB', min: 30, max: 120, threshold: 85 }
    ];
    const statuses = ['active', 'active', 'active', 'active', 'inactive', 'warning', 'error'];

    return Array.from({ length: count }, (_, i) => {
        const ind = pick(industries);
        const coords = jitter(centers[ind]);
        const st = pick(sensorTypes);
        const value = st.type === 'motion' || st.type === 'door'
            ? pick([0, 1])
            : randFloat(st.min, st.max);
        return {
            id: `SNS-${String(i + 1).padStart(4, '0')}`,
            name: `${st.type.charAt(0).toUpperCase() + st.type.slice(1)} Sensor ${i + 1}`,
            type: st.type,
            industry: ind,
            zone: pick(zones[ind]),
            status: pick(statuses),
            coordinates: coords,
            value,
            unit: st.unit,
            threshold: st.threshold,
            isAboveThreshold: value > st.threshold,
            battery: randInt(10, 100),
            protocol: pick(['MQTT', 'LoRa', 'Zigbee', 'BLE', 'HTTP']),
            lastReading: timeAgo(0, 300000),
            history: Array.from({ length: 24 }, (_, h) => ({
                timestamp: new Date(Date.now() - h * 3600000).toISOString(),
                value: st.type === 'motion' || st.type === 'door' ? pick([0, 1]) : randFloat(st.min, st.max)
            })),
            createdAt: timeAgo(86400000 * 30, 86400000 * 365)
        };
    });
}

// ═══════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════
function generateEvents(count = 200) {
    const eventTypes = [
        { type: 'person_detected', severity: 'low', desc: 'Person detected in monitored area' },
        { type: 'vehicle_detected', severity: 'low', desc: 'Vehicle detected in zone' },
        { type: 'intrusion_detected', severity: 'critical', desc: 'Unauthorized entry in restricted area' },
        { type: 'loitering_detected', severity: 'high', desc: 'Loitering detected near perimeter' },
        { type: 'crowd_threshold', severity: 'medium', desc: 'Crowd density exceeded threshold' },
        { type: 'ppe_violation', severity: 'high', desc: 'Personnel without required PPE detected' },
        { type: 'fire_detected', severity: 'critical', desc: 'Possible fire/smoke detected' },
        { type: 'gas_leak', severity: 'critical', desc: 'Gas concentration above safe levels' },
        { type: 'temperature_alert', severity: 'medium', desc: 'Temperature exceeded threshold' },
        { type: 'motion_detected', severity: 'low', desc: 'Motion detected by sensor' },
        { type: 'door_forced', severity: 'high', desc: 'Unauthorized door access detected' },
        { type: 'drone_anomaly', severity: 'medium', desc: 'Drone detected anomaly during patrol' },
        { type: 'license_plate', severity: 'low', desc: 'License plate recognized' },
        { type: 'object_left', severity: 'medium', desc: 'Unattended object detected' },
        { type: 'perimeter_breach', severity: 'critical', desc: 'Perimeter fence breach detected' }
    ];
    const sources = ['camera', 'camera', 'camera', 'drone', 'sensor', 'sensor'];

    return Array.from({ length: count }, (_, i) => {
        const ev = pick(eventTypes);
        const ind = pick(industries);
        const src = pick(sources);
        const sourceId = src === 'camera'
            ? `CAM-${String(randInt(1, 64)).padStart(4, '0')}`
            : src === 'drone'
                ? `DRN-${String(randInt(1, 12)).padStart(3, '0')}`
                : `SNS-${String(randInt(1, 96)).padStart(4, '0')}`;

        return {
            id: `EVT-${String(i + 1).padStart(6, '0')}`,
            timestamp: timeAgo(0, 86400000 * 7),
            source: src,
            sourceId,
            type: ev.type,
            severity: ev.severity,
            description: ev.desc,
            industry: ind,
            zone: pick(zones[ind]),
            acknowledged: Math.random() > 0.6,
            metadata: {
                confidence: randFloat(0.7, 0.99),
                objectCount: randInt(1, 5),
                boundingBoxes: randInt(1, 3)
            }
        };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ═══════════════════════════════════════════════════════
// ALERTS
// ═══════════════════════════════════════════════════════
function generateAlerts(count = 50) {
    const severities = ['critical', 'high', 'medium', 'low'];
    const alertStatuses = ['active', 'active', 'acknowledged', 'resolved'];
    const titles = [
        'Intrusion Alert — Perimeter Breach',
        'PPE Violation — Hard Hat Missing',
        'Gas Leak Detected — Sector 7',
        'Unauthorized Vehicle — Loading Dock',
        'Fire Alarm Triggered — Storage Unit',
        'Crowd Overcapacity — Main Entrance',
        'Drone Lost Signal — Patrol Route B',
        'Equipment Tampering — Substation',
        'Temperature Critical — Server Room',
        'Loitering Alert — Restricted Area',
        'Door Forced Open — Warehouse B',
        'Vibration Anomaly — Pipeline Monitor',
        'Smoke Detected — Assembly Area',
        'Unattended Object — Platform Level 3',
        'License Plate Flagged — Vehicle DB Match'
    ];

    return Array.from({ length: count }, (_, i) => {
        const sev = pick(severities);
        const ind = pick(industries);
        return {
            id: `ALT-${String(i + 1).padStart(5, '0')}`,
            timestamp: timeAgo(0, 86400000 * 3),
            ruleId: `RUL-${String(randInt(1, 20)).padStart(3, '0')}`,
            severity: sev,
            title: pick(titles),
            description: `Automated alert triggered by rule engine. Confidence: ${randFloat(0.85, 0.99)}. Multiple sources correlated.`,
            sources: Array.from({ length: randInt(1, 3) }, () =>
                `CAM-${String(randInt(1, 64)).padStart(4, '0')}`
            ),
            industry: ind,
            zone: pick(zones[ind]),
            status: pick(alertStatuses),
            assignedTo: pick(['admin', 'operator1', 'operator2', null]),
            acknowledgedAt: Math.random() > 0.5 ? timeAgo(0, 3600000) : null,
            resolvedAt: Math.random() > 0.7 ? timeAgo(0, 1800000) : null
        };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ═══════════════════════════════════════════════════════
// RULES
// ═══════════════════════════════════════════════════════
function generateRules() {
    return [
        { id: 'RUL-001', name: 'Perimeter Intrusion', conditions: [{ source: 'camera', event: 'intrusion_detected', zone: 'any' }], actions: ['alert', 'notify_soc', 'activate_siren'], severity: 'critical', enabled: true, industry: 'oil_gas' },
        { id: 'RUL-002', name: 'PPE Non-Compliance', conditions: [{ source: 'camera', event: 'ppe_violation', confidence: '>0.85' }], actions: ['alert', 'notify_supervisor'], severity: 'high', enabled: true, industry: 'oil_gas' },
        { id: 'RUL-003', name: 'Gas Leak Response', conditions: [{ source: 'sensor', type: 'gas', operator: '>', value: 200 }], actions: ['alert', 'evacuate_zone', 'shutdown_ventilation'], severity: 'critical', enabled: true, industry: 'oil_gas' },
        { id: 'RUL-004', name: 'Forklift Zone Violation', conditions: [{ source: 'camera', event: 'vehicle_detected', zone: 'pedestrian_only' }], actions: ['alert', 'notify_floor_manager'], severity: 'high', enabled: true, industry: 'warehouse' },
        { id: 'RUL-005', name: 'Cold Storage Temp Alert', conditions: [{ source: 'sensor', type: 'temperature', operator: '>', value: -15 }], actions: ['alert', 'notify_maintenance'], severity: 'medium', enabled: true, industry: 'warehouse' },
        { id: 'RUL-006', name: 'After-Hours Motion', conditions: [{ source: 'sensor', type: 'motion', timeRange: '22:00-06:00' }], actions: ['alert', 'activate_cameras', 'notify_security'], severity: 'high', enabled: true, industry: 'warehouse' },
        { id: 'RUL-007', name: 'Crowd Density Limit', conditions: [{ source: 'camera', event: 'crowd_threshold', count: '>500' }], actions: ['alert', 'notify_city_ops', 'deploy_patrol'], severity: 'medium', enabled: true, industry: 'smart_city' },
        { id: 'RUL-008', name: 'Traffic Congestion', conditions: [{ source: 'camera', event: 'vehicle_detected', density: '>0.8' }], actions: ['alert', 'update_traffic_signals'], severity: 'low', enabled: true, industry: 'smart_city' },
        { id: 'RUL-009', name: 'Loitering Detection', conditions: [{ source: 'camera', event: 'loitering_detected', duration: '>300s' }], actions: ['alert', 'dispatch_patrol'], severity: 'medium', enabled: true, industry: 'smart_city' },
        { id: 'RUL-010', name: 'Fire & Smoke Detection', conditions: [{ source: 'camera', event: 'fire_detected' }, { source: 'sensor', type: 'smoke', operator: '>', value: 30 }], actions: ['alert', 'evacuate_building', 'call_fire_dept'], severity: 'critical', enabled: true, industry: 'warehouse' },
        { id: 'RUL-011', name: 'Drone Battery Low', conditions: [{ source: 'drone', battery: '<20' }], actions: ['alert', 'auto_return_to_base'], severity: 'medium', enabled: true, industry: 'oil_gas' },
        { id: 'RUL-012', name: 'Vibration Anomaly', conditions: [{ source: 'sensor', type: 'vibration', operator: '>', value: 15 }], actions: ['alert', 'schedule_inspection'], severity: 'high', enabled: true, industry: 'oil_gas' },
        { id: 'RUL-013', name: 'Unauthorized Door Access', conditions: [{ source: 'sensor', type: 'door', event: 'forced_open' }], actions: ['alert', 'lockdown_zone', 'notify_security'], severity: 'critical', enabled: true, industry: 'warehouse' },
        { id: 'RUL-014', name: 'License Plate Blacklist', conditions: [{ source: 'camera', event: 'license_plate', match: 'blacklist' }], actions: ['alert', 'block_gate', 'notify_law_enforcement'], severity: 'critical', enabled: true, industry: 'smart_city' },
        { id: 'RUL-015', name: 'Multi-Source Correlation', conditions: [{ source: 'camera', event: 'person_detected' }, { source: 'sensor', type: 'motion' }, { timeWindow: '30s' }], actions: ['alert', 'escalate_to_soc'], severity: 'high', enabled: true, industry: 'oil_gas' }
    ];
}

// ═══════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════
function generateUsers() {
    return [
        { id: 'USR-001', username: 'admin', fullName: 'System Administrator', email: 'admin@sentinel.io', role: 'admin', status: 'active', avatar: null, lastLogin: timeAgo(0, 3600000), createdAt: timeAgo(86400000 * 365, 86400000 * 730) },
        { id: 'USR-002', username: 'j.mitchell', fullName: 'James Mitchell', email: 'j.mitchell@sentinel.io', role: 'operator', status: 'active', avatar: null, lastLogin: timeAgo(0, 7200000), createdAt: timeAgo(86400000 * 60, 86400000 * 300) },
        { id: 'USR-003', username: 's.chen', fullName: 'Sarah Chen', email: 's.chen@sentinel.io', role: 'operator', status: 'active', avatar: null, lastLogin: timeAgo(0, 18000000), createdAt: timeAgo(86400000 * 30, 86400000 * 200) },
        { id: 'USR-004', username: 'r.kumar', fullName: 'Raj Kumar', email: 'r.kumar@sentinel.io', role: 'viewer', status: 'active', avatar: null, lastLogin: timeAgo(3600000, 86400000), createdAt: timeAgo(86400000 * 10, 86400000 * 100) },
        { id: 'USR-005', username: 'm.santos', fullName: 'Maria Santos', email: 'm.santos@sentinel.io', role: 'operator', status: 'active', avatar: null, lastLogin: timeAgo(0, 86400000), createdAt: timeAgo(86400000 * 20, 86400000 * 150) },
        { id: 'USR-006', username: 'd.okonkwo', fullName: 'David Okonkwo', email: 'd.okonkwo@sentinel.io', role: 'admin', status: 'active', avatar: null, lastLogin: timeAgo(0, 43200000), createdAt: timeAgo(86400000 * 90, 86400000 * 400) },
        { id: 'USR-007', username: 'l.wagner', fullName: 'Lisa Wagner', email: 'l.wagner@sentinel.io', role: 'viewer', status: 'inactive', avatar: null, lastLogin: timeAgo(86400000 * 7, 86400000 * 30), createdAt: timeAgo(86400000 * 180, 86400000 * 500) }
    ];
}

// ═══════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════
function generateAnalytics() {
    const hours = Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2, '0')}:00`,
        detections: randInt(5, 80),
        alerts: randInt(0, 15),
        incidents: randInt(0, 5)
    }));

    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return {
            date: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('en', { weekday: 'short' }),
            totalDetections: randInt(200, 1200),
            totalAlerts: randInt(10, 80),
            avgResponseTime: randFloat(15, 180, 0),
            criticalIncidents: randInt(0, 8)
        };
    });

    const byType = [
        { type: 'Person Detection', count: randInt(800, 3000), color: '#22d3ee' },
        { type: 'Vehicle Detection', count: randInt(300, 1000), color: '#a78bfa' },
        { type: 'Intrusion', count: randInt(5, 50), color: '#ef4444' },
        { type: 'PPE Violation', count: randInt(20, 200), color: '#f59e0b' },
        { type: 'Loitering', count: randInt(10, 80), color: '#10b981' },
        { type: 'Crowd Alert', count: randInt(5, 40), color: '#3b82f6' },
        { type: 'Fire/Smoke', count: randInt(0, 10), color: '#f43f5e' },
        { type: 'Gas Leak', count: randInt(0, 15), color: '#6366f1' }
    ];

    const bySeverity = [
        { severity: 'Critical', count: randInt(5, 30), color: '#ef4444' },
        { severity: 'High', count: randInt(20, 80), color: '#f59e0b' },
        { severity: 'Medium', count: randInt(40, 150), color: '#3b82f6' },
        { severity: 'Low', count: randInt(100, 400), color: '#6b7280' }
    ];

    return { hourly: hours, daily: days, byType, bySeverity };
}

// ═══════════════════════════════════════════════════════
// SYSTEM HEALTH
// ═══════════════════════════════════════════════════════
function generateSystemHealth(cameras, drones, sensors) {
    const onlineCams = cameras.filter(c => c.status === 'online').length;
    const activeDrones = drones.filter(d => d.status === 'patrolling').length;
    const activeSensors = sensors.filter(s => s.status === 'active').length;

    return {
        timestamp: new Date().toISOString(),
        uptime: '99.97%',
        uptimeSeconds: randInt(500000, 2000000),
        cameras: { total: cameras.length, online: onlineCams, offline: cameras.length - onlineCams },
        drones: { total: drones.length, active: activeDrones, docked: drones.length - activeDrones },
        sensors: { total: sensors.length, active: activeSensors, inactive: sensors.length - activeSensors },
        cpu: randFloat(20, 65),
        memory: randFloat(40, 75),
        storage: randFloat(30, 60),
        network: { latency: randInt(2, 15), bandwidth: randFloat(500, 950) },
        aiEngine: { status: 'running', modelsLoaded: 8, inferenceRate: randInt(20, 60), gpuUtil: randFloat(40, 85) },
        lastIncident: timeAgo(0, 86400000)
    };
}

// ═══════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════
const cameras = generateCameras(64);
const drones = generateDrones(12);
const sensors = generateSensors(96);
const events = generateEvents(200);
const alerts = generateAlerts(50);
const rules = generateRules();
const users = generateUsers();
const analytics = generateAnalytics();
const systemHealth = generateSystemHealth(cameras, drones, sensors);

module.exports = {
    cameras, drones, sensors, events, alerts, rules, users, analytics, systemHealth,
    // Re-generators for WebSocket simulation
    generateEvents, generateAlerts, generateSystemHealth,
    pick, randInt, randFloat, timeAgo, zones, industries, centers
};
