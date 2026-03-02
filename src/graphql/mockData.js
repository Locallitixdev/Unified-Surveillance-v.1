// Adapted from server/data/mockData.cjs for frontend use
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dec = 2) => +(Math.random() * (max - min) + min).toFixed(dec);
const timeAgo = (minMs, maxMs) => new Date(Date.now() - randInt(minMs, maxMs)).toISOString();

const industries = ['oil_gas', 'warehouse', 'smart_city'];
const zonesArr = {
    oil_gas: ['Hazmat Storage', 'Perimeter North', 'Helipad Zone', 'Tank Farm'],
    warehouse: ['Loading Dock A', 'Loading Dock B', 'Storage Bay 1', 'Storage Bay 2', 'Assembly Line', 'Cold Storage'],
    smart_city: ['Simpang Yasmin', 'Taman Sempur', 'Tugu Kujang', 'Alun-Alun Kota', 'Simpang Bubulak', 'Simpang Pomad', 'Botani Square', 'Kebun Raya']
};

const centers = {
    oil_gas: { lat: -6.580, lng: 106.780 },
    warehouse: { lat: -6.590, lng: 106.810 },
    smart_city: { lat: -6.597, lng: 106.790 }
};

const jitter = (center, range = 0.02) => ({
    lat: +(center.lat + (Math.random() - 0.5) * range).toFixed(6),
    lng: +(center.lng + (Math.random() - 0.5) * range).toFixed(6)
});

const LIVE_CAMERAS = [
    { "name": "JL.BARU DEPAN UNDERPASS", "type": "Fixed", "zone": "Bogor", "lat": -6.560897, "lng": 106.804757, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/807907af-8920-439d-9ae6-b67daa216818.m3u8" },
    { "name": "JL. BARU DEPAN UNDERPASS 2", "type": "Fixed", "zone": "Bogor", "lat": -6.561229, "lng": 106.805079, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/ad7725b1-5f9a-4ccb-97e2-9f5a68990865.m3u8" },
    { "name": "Simpang Yasmin", "type": "Fixed", "zone": "Bogor", "lat": -6.555815, "lng": 106.778969, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/fa74138a-dd7e-4f10-8174-69475584073d.m3u8" },
    { "name": "Simpang Yasmin 2", "type": "Fixed", "zone": "Bogor", "lat": -6.556080, "lng": 106.778646, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/c18014c9-7e81-4fc4-a799-b71fe2718e08.m3u8" },
    { "name": "Manunggal", "type": "Fixed", "zone": "Bogor", "lat": -6.586342, "lng": 106.783213, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/fafe128b-2570-4c74-9ca1-da1286fdf59d.m3u8" },
    { "name": "Sebelum Under pass", "type": "Fixed", "zone": "Bogor", "lat": -6.561229, "lng": 106.806997, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/9c47a00d-90ce-44de-835e-1a4d704f7901.m3u8" },
    { "name": "Sebelum under pass 2", "type": "Fixed", "zone": "Bogor", "lat": -6.562337, "lng": 106.795821, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/d220d1d8-ff5f-40ee-a3f8-019deb6bd019.m3u8" },
    { "name": "Kol Ah Syam", "type": "Fixed", "zone": "Bogor", "lat": -6.597908, "lng": 106.818066, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/244ee10c-bbb3-4f48-852a-b7bd6fbf5aa1.m3u8" },
    { "name": "Kol Ah Syam 2", "type": "Fixed", "zone": "Bogor", "lat": -6.596235, "lng": 106.817788, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/f03456d3-1d6c-4156-b301-e66e85e1b52e.m3u8" },
    { "name": "Kol Ah Syam Atas", "type": "Fixed", "zone": "Bogor", "lat": -6.597174, "lng": 106.817874, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/83608f94-69a9-4341-a821-beb90fdee6e3.m3u8" },
    { "name": "Simpang Katulampa", "type": "Fixed", "zone": "Bogor", "lat": -6.622207, "lng": 106.829598, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/7c1016d7-cba8-4ed0-995d-6bbd44920698.m3u8" },
    { "name": "Soematra Dirge", "type": "Fixed", "zone": "Bogor", "lat": -6.628638, "lng": 106.807426, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/c7f1e1d4-0238-41a8-a9f2-2d4b3c5d8d60.m3u8" },
    { "name": "Gt Kayu Manis", "type": "Fixed", "zone": "Bogor", "lat": -6.528667, "lng": 106.765527, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/9a2a170b-06b5-4401-ac60-3d0d7fdc44bf.m3u8" },
    { "name": "Depan Yogya", "type": "Fixed", "zone": "Bogor", "lat": -6.561549, "lng": 106.791806, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/f35a34ac-7528-4582-96bb-1f5f0a226f07.m3u8" },
    { "name": "Jl Raya Tajur", "type": "Fixed", "zone": "Bogor", "lat": -6.638537, "lng": 106.832533, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/c230942d-4764-4124-8c77-4b2d24de4b24.m3u8" },
    { "name": "Jl Raya Tajur 2", "type": "Fixed", "zone": "Bogor", "lat": -6.637443, "lng": 106.830622, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/7e36d5b9-b437-4ba2-a36f-9c8905b66d55.m3u8" },
    { "name": "Depan Yogya 2", "type": "Fixed", "zone": "Bogor", "lat": -6.562840, "lng": 106.796416, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/c9fdf5ba-ae6c-477c-bec2-f1599f534950.m3u8" },
    { "name": "Jl Cibadak Toll", "type": "Fixed", "zone": "Bogor", "lat": -6.553322, "lng": 106.775827, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/1e4f5b21-a026-4a51-928b-c3a9ce22bce4.m3u8" },
    { "name": "Jl Cibadak", "type": "Fixed", "zone": "Bogor", "lat": -6.550032, "lng": 106.775248, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/19e925c3-f404-409e-9719-ea285acf9377.m3u8" },
    { "name": "Simpang Pahlawan", "type": "Fixed", "zone": "Bogor", "lat": -6.613803, "lng": 106.803351, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/d8047631-e56c-4b58-9b41-e96d47a4c187.m3u8" },
    { "name": "Simpang Pahlawan Dereded", "type": "Fixed", "zone": "Bogor", "lat": -6.614402, "lng": 106.803493, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/d3579a4b-ec79-4512-8173-d956cdf098ac.m3u8" },
    { "name": "JL Dereded", "type": "Fixed", "zone": "Bogor", "lat": -6.614731, "lng": 106.802455, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/3216f8c7-d3b9-4fac-ba7d-de18ee9a8090.m3u8" },
    { "name": "Simpang Pasar Dewi Sartika", "type": "Fixed", "zone": "Bogor", "lat": -6.590679, "lng": 106.792500, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/9ecd30db-6cff-43eb-aef2-5c846b10c799.m3u8" },
    { "name": "Simpang Dewi Sartika 2", "type": "Fixed", "zone": "Bogor", "lat": -6.590130, "lng": 106.792609, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/ac6de512-c9bf-48fd-b438-953481a43a17.m3u8" },
    { "name": "Jembatan Bhayangkara", "type": "Fixed", "zone": "Bogor", "lat": -6.562142, "lng": 106.808174, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/0316066f-7936-44ce-9acd-d2f9032d44b4.m3u8" },
    { "name": "Simpang Dadali", "type": "Fixed", "zone": "Bogor", "lat": -6.568736, "lng": 106.805731, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/83c68a43-dce7-4eea-a86d-913ff5a2a08a.m3u8" },
    { "name": "Simpang Dadali 2", "type": "Fixed", "zone": "Bogor", "lat": -6.569150, "lng": 106.805518, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/cb79f4a2-f7f2-4e56-b848-f2e9eb9edcc6.m3u8" },
    { "name": "Taman Heulang", "type": "Fixed", "zone": "Bogor", "lat": -6.569620, "lng": 106.802658, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/8f5ed3cb-5ab6-4687-b259-a3c5c46c5fed.m3u8" },
    { "name": "Taman Sempur", "type": "Fixed", "zone": "Bogor", "lat": -6.591014, "lng": 106.801067, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/b5af80c7-6bd1-4b1e-9fb3-f847e012cb80.m3u8" },
    { "name": "Jl Semeru 1", "type": "Fixed", "zone": "Bogor", "lat": -6.583841, "lng": 106.780432, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/acb7a829-1c3a-4429-8b37-d53647d69d53.m3u8" },
    { "name": "JL Semeru 2", "type": "Fixed", "zone": "Bogor", "lat": -6.585574, "lng": 106.781930, "streamUrl": "https://restreamer6.kotabogor.go.id/memfs/1c6642fb-f4e9-4c2c-9411-c994d7332fea.m3u8" },
    { "name": "Simpang Bubulak", "type": "Fixed", "zone": "Bogor", "lat": -6.573266, "lng": 106.751422, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/09fc93cb-7267-407c-8809-c8b06b004b4a.m3u8" },
    { "name": "Mayor Oking", "type": "Fixed", "zone": "Bogor", "lat": -6.593344, "lng": 106.789966, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/66a4ac45-9646-42e7-804c-5293af4ee4fc.m3u8" },
    { "name": "Pasar Mawar", "type": "Fixed", "zone": "Bogor", "lat": -6.590238, "lng": 106.787963, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/baccd872-4c65-4832-9f33-c5b4d467e777.m3u8" },
    { "name": "Simpang Dramaga", "type": "Fixed", "zone": "Bogor", "lat": -6.575820, "lng": 106.737632, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/51e9eed5-4b9a-4d45-bd04-8e3fc7485a67.m3u8" },
    { "name": "Pasar Mawar 2", "type": "Fixed", "zone": "Bogor", "lat": -6.590417, "lng": 106.786121, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/09ca573e-e121-4689-aac7-c4ee4b1278fa.m3u8" },
    { "name": "Pasar Gunung Batu", "type": "Fixed", "zone": "Bogor", "lat": -6.594150, "lng": 106.777782, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/a4e728ef-9bbc-4c89-a303-9d4a160cb940.m3u8" },
    { "name": "Simpang Bubulak 2", "type": "Fixed", "zone": "Bogor", "lat": -6.573510, "lng": 106.751586, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/d8e16825-1d69-4eee-9bb9-1368131a56e7.m3u8" },
    { "name": "Pasar Gn Batu 2", "type": "Fixed", "zone": "Bogor", "lat": -6.594474, "lng": 106.778107, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/c749c699-6399-446f-9207-478be7de226d.m3u8" },
    { "name": "Sindang Barangan", "type": "Fixed", "zone": "Bogor", "lat": -6.580172, "lng": 106.763389, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/b85b93a4-22dd-418a-ae88-8322f0bc479f.m3u8" },
    { "name": "Simpang Sindang Barangan", "type": "Fixed", "zone": "Bogor", "lat": -6.569460, "lng": 106.757532, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/83eb5f01-df58-4cc1-8cd0-2f507be57649.m3u8" },
    { "name": "Dewi Sartika Alun Alun", "type": "Fixed", "zone": "Bogor", "lat": -6.594426, "lng": 106.791925, "streamUrl": "https://restreamer4.kotabogor.go.id/memfs/9c1f117e-11e7-4249-abb9-c75749a90761.m3u8" },
    { "name": "CCTV Sindang Barangan", "type": "Fixed", "zone": "Bogor", "lat": -6.573371, "lng": 106.751741, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/534eb46c-159d-43c9-ae35-2f273245f257.m3u8" },
    { "name": "Putaran Bondes", "type": "Fixed", "zone": "Bogor", "lat": -6.561461, "lng": 106.802513, "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/22d63eda-40bb-4fed-95c3-7c4eeef51cbf.m3u8" },
    { "name": "Jl Mawar Arah Semeru", "type": "Fixed", "zone": "Bogor", "lat": -6.590386, "lng": 106.786108, "streamUrl": "https://restreamer3.kotabogor.go.id/memfs/3b191b4b-6473-401d-9508-fe4a61be876b.m3u8" },
    { "name": "Pertigaan Mawar", "type": "Fixed", "zone": "Bogor", "lat": -6.590182, "lng": 106.786150, "streamUrl": "https://restreamer3.kotabogor.go.id/memfs/8b39d204-4039-4352-b236-01635b3f5e7a.m3u8" },
    { "name": "Jl Juanda", "type": "Fixed", "zone": "Bogor", "lat": -6.597724, "lng": 106.793864, "streamUrl": "https://restreamer3.kotabogor.go.id/memfs/e2d12ced-bcc3-4826-b872-97fcce335e93.m3u8" },
    { "name": "Juanda Depan Balaikota", "type": "Fixed", "zone": "Bogor", "lat": -6.595170, "lng": 106.794261, "streamUrl": "https://restreamer3.kotabogor.go.id/memfs/e7d14e54-b9bd-474a-8976-dd08baec4498.m3u8" },
    { "name": "Arah Balai Kota", "type": "Fixed", "zone": "Bogor", "lat": -6.596383, "lng": 106.793881, "streamUrl": "https://restreamer3.kotabogor.go.id/memfs/519d2368-103e-4e7c-860c-35d66a7f6352.m3u8" },
    { "name": "Taman Pangrango", "type": "Fixed", "zone": "Bogor", "lat": -6.592183, "lng": 106.804216, "streamUrl": "https://restreamer.kotabogor.go.id/memfs/ce8e9840-f59d-4ae3-a82d-39e978dd0a56.m3u8" },
    { "name": "Taman Kencana", "type": "Fixed", "zone": "Bogor", "lat": -6.589150, "lng": 106.801793, "streamUrl": "https://restreamer.kotabogor.go.id/memfs/b397dea2-8884-4c22-b6a9-f0acd0a204ea.m3u8" }
];

export function generateCameras() {
    return LIVE_CAMERAS.map((live, i) => ({
        id: `CAM-${String(i + 1).padStart(4, '0')}`,
        name: live.name,
        industry: 'smart_city',
        zone: live.zone || 'Bogor',
        type: live.type || 'Fixed',
        protocol: 'HLS',
        resolution: '1080p',
        status: 'online',
        coordinates: { lat: live.lat, lng: live.lng },
        ip: `10.20.30.${i + 1}`,
        port: 80,
        streamUrl: live.streamUrl,
        lastDetection: new Date().toISOString(),
        fps: 30,
        recording: true,
        nightVision: true,
        createdAt: new Date().toISOString()
    }));
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

export const cameras = generateCameras();
export const drones = generateDrones(8);
export const sensors = generateSensors(32);

export const events = [
    { id: 'EVT-000001', timestamp: new Date().toISOString(), source: 'camera', sourceId: 'CAM-0001', type: 'person_detected', severity: 'low', description: 'Person detected in monitored area', zone: 'Simpang Yasmin' },
    { id: 'EVT-000002', timestamp: new Date().toISOString(), source: 'sensor', sourceId: 'SNS-0002', type: 'pressure_alert', severity: 'high', description: 'Pressure exceeded threshold', zone: 'Alun-Alun' },
    { id: 'EVT-000003', timestamp: new Date().toISOString(), source: 'drone', sourceId: 'DRN-001', type: 'perimeter_breach', severity: 'critical', description: 'Intrusion detected near north fence', zone: 'Kebun Raya' }
];

export const alerts = [
    { id: 'ALT-00001', timestamp: new Date().toISOString(), severity: 'critical', title: 'Perimeter Breach', description: 'Immediate response required at North Sector.', zone: 'Tugu Kujang', status: 'active' },
    { id: 'ALT-00002', timestamp: new Date().toISOString(), severity: 'high', title: 'PPE Violation', description: 'Worker detected without hard hat.', zone: 'Kebun Raya', status: 'active' }
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
    { id: 'MSN-2024-001', name: 'Perimeter Sweep - Tugu Kujang', status: 'active', startTime: '2024-02-24T08:00:00Z' },
    { id: 'MSN-2024-002', name: 'Thermal Inspection - Kebun Raya', status: 'completed', startTime: '2024-02-24T09:30:00Z' }
];

export const missionTelemetry = {
    'MSN-2024-001': [
        { altitude: 42, velocity: 15.2, coordinates: { lat: -6.597, lng: 106.790 }, timestamp: new Date().toISOString() }
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
