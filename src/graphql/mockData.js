// Adapted from server/data/mockData.cjs for frontend use
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dec = 2) => +(Math.random() * (max - min) + min).toFixed(dec);
const timeAgo = (minMs, maxMs) => new Date(Date.now() - randInt(minMs, maxMs)).toISOString();

const industries = ['oil_gas', 'warehouse', 'smart_city'];
const zonesArr = {
    oil_gas: ['Rig Platform A', 'Rig Platform B', 'Pipeline Sector 7', 'Refinery East', 'Hazmat Storage', 'Perimeter North', 'Helipad Zone', 'Tank Farm'],
    warehouse: ['Loading Dock A', 'Loading Dock B', 'Storage Bay 1', 'Storage Bay 2', 'Assembly Line', 'Office Wing', 'Parking Lot', 'Cold Storage'],
    smart_city: ['Downtown Core', 'Transit Hub', 'Park District', 'Highway I-90', 'Shopping Mall', 'Stadium Area', 'Residential Block 5', 'Industrial Zone']
};

const centers = {
    oil_gas: { lat: 1.35, lng: 103.82 },
    warehouse: { lat: 1.34, lng: 103.84 },
    smart_city: { lat: 1.36, lng: 103.85 }
};

const jitter = (center, range = 0.02) => ({
    lat: +(center.lat + (Math.random() - 0.5) * range).toFixed(6),
    lng: +(center.lng + (Math.random() - 0.5) * range).toFixed(6)
});

export function generateCameras(count = 64) {
    const types = ['PTZ', 'Fixed', 'Dome', 'Bullet', 'Thermal'];
    const protocols = ['RTSP', 'ONVIF', 'RTMP'];
    const resolutions = ['1080p', '4K', '720p', '4K UHD'];
    const statuses = ['online', 'online', 'online', 'online', 'offline', 'maintenance'];

    return Array.from({ length: count }, (_, i) => {
        const ind = pick(industries);
        const coords = jitter(centers[ind]);
        return {
            id: `CAM-${String(i + 1).padStart(4, '0')}`,
            name: `${pick(zonesArr[ind])} Cam ${i + 1}`,
            industry: ind,
            zone: pick(zonesArr[ind]),
            type: pick(types),
            protocol: pick(protocols),
            resolution: pick(resolutions),
            status: pick(statuses),
            coordinates: coords,
            lastDetection: timeAgo(0, 3600000)
        };
    });
}

export function generateDrones(count = 12) {
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
            assignedZone: pick(zonesArr[ind]),
            status: pick(statuses),
            coordinates: coords,
            altitude: randInt(30, 120),
            battery: randInt(15, 100),
            speed: randFloat(0, 45, 1),
            flightTime: randInt(5, 35)
        };
    });
}

export function generateSensors(count = 96) {
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
        const st = pick(sensorTypes);
        const value = st.type === 'motion' || st.type === 'door'
            ? pick([0, 1])
            : randFloat(st.min, st.max);
        const coords = jitter(centers[ind], 0.015);
        return {
            id: `SNS-${String(i + 1).padStart(4, '0')}`,
            name: `${st.type.charAt(0).toUpperCase() + st.type.slice(1)} Sensor ${i + 1}`,
            type: st.type,
            industry: ind,
            zone: pick(zonesArr[ind]),
            status: pick(statuses),
            value,
            unit: st.unit,
            threshold: st.threshold,
            isAboveThreshold: value > st.threshold,
            coordinates: coords,
            battery: randInt(10, 100),
            protocol: pick(['MQTT', 'LoRa', 'Zigbee', 'BLE', 'HTTP']),
            lastReading: timeAgo(0, 300000)
        };
    });
}

export const cameras = generateCameras(24);
export const drones = generateDrones(8);
export const sensors = generateSensors(32);

export const events = [
    { id: 'EVT-000001', timestamp: new Date().toISOString(), source: 'camera', sourceId: 'CAM-0001', type: 'person_detected', severity: 'low', description: 'Person detected in monitored area', zone: 'Downtown Core' },
    { id: 'EVT-000002', timestamp: new Date().toISOString(), source: 'sensor', sourceId: 'SNS-0002', type: 'pressure_alert', severity: 'high', description: 'Pressure exceeded threshold', zone: 'Refinery East' },
    { id: 'EVT-000003', timestamp: new Date().toISOString(), source: 'drone', sourceId: 'DRN-001', type: 'perimeter_breach', severity: 'critical', description: 'Intrusion detected near north fence', zone: 'Sector A' }
];

export const alerts = [
    { id: 'ALT-00001', timestamp: new Date().toISOString(), severity: 'critical', title: 'Perimeter Breach', description: 'Immediate response required at North Sector.', zone: 'Sector A', status: 'active' },
    { id: 'ALT-00002', timestamp: new Date().toISOString(), severity: 'high', title: 'PPE Violation', description: 'Worker detected without hard hat.', zone: 'Refinery West', status: 'active' }
];

export const analyticsSummary = {
    camerasOnline: 22,
    criticalAlerts: 2,
    totalDetections: 12450,
    dronesActive: 4,
    sensorsActive: 88,
    avgResponseTime: 45
};

export const analytics = {
    hourly: Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2, '0')}:00`,
        detections: Math.floor(Math.random() * 50) + 10,
        alerts: Math.floor(Math.random() * 5),
        incidents: Math.floor(Math.random() * 2)
    })),
    daily: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return {
            date: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('en', { weekday: 'short' }),
            totalDetections: Math.floor(Math.random() * 1000) + 500,
            totalAlerts: Math.floor(Math.random() * 50) + 10,
            avgResponseTime: Math.floor(Math.random() * 100) + 30,
            criticalIncidents: Math.floor(Math.random() * 5)
        };
    }),
    byType: [
        { type: 'Person Detection', count: 1250, color: '#22d3ee' },
        { type: 'Vehicle Detection', count: 840, color: '#a78bfa' },
        { type: 'Intrusion', count: 12, color: '#ef4444' },
        { type: 'PPE Violation', count: 45, color: '#f59e0b' },
        { type: 'Loitering', count: 30, color: '#10b981' }
    ],
    bySeverity: [
        { severity: 'Critical', count: 5, color: '#ef4444' },
        { severity: 'High', count: 15, color: '#f59e0b' },
        { severity: 'Medium', count: 40, color: '#3b82f6' },
        { severity: 'Low', count: 120, color: '#6b7280' }
    ]
};

export const missions = [
    { id: 'MSN-2024-001', name: 'Perimeter Sweep - Sector 7', status: 'active', startTime: '2024-02-24T08:00:00Z' },
    { id: 'MSN-2024-002', name: 'Thermal Inspection - Tank Farm', status: 'completed', startTime: '2024-02-24T09:30:00Z' }
];

export const missionTelemetry = {
    'MSN-2024-001': [
        { altitude: 42, velocity: 15.2, coordinates: { lat: 1.352, lng: 103.821 }, timestamp: new Date().toISOString() }
    ]
};

export const usersArr = [
    { id: 'USR-001', username: 'admin', fullName: 'System Administrator', email: 'admin@sentinel.io', role: 'admin', status: 'active', lastLogin: new Date().toISOString() },
    { id: 'USR-002', username: 'j.mitchell', fullName: 'James Mitchell', email: 'j.mitchell@sentinel.io', role: 'operator', status: 'active', lastLogin: new Date().toISOString() },
    { id: 'USR-003', username: 's.chen', fullName: 'Sarah Chen', email: 's.chen@sentinel.io', role: 'operator', status: 'active', lastLogin: new Date().toISOString() }
];

export const rulesArr = [
    { id: 'RUL-001', name: 'Perimeter Intrusion', severity: 'critical', industry: 'oil_gas', actions: ['alert', 'notify_soc'], enabled: true },
    { id: 'RUL-002', name: 'PPE Non-Compliance', severity: 'high', industry: 'warehouse', actions: ['alert'], enabled: true },
    { id: 'RUL-003', name: 'Gas Leak Response', severity: 'critical', industry: 'smart_city', actions: ['alert', 'evacuate'], enabled: false }
];
