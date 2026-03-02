/**
 * Database seeder — runs schema.sql then inserts mock data.
 * Usage: node server/db/seed.cjs
 */
const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('./db.cjs');
const mockData = require('../data/mockData.cjs');

async function seed() {
    console.log('');
    console.log('  🌱 SENTINEL Database Seeder');
    console.log('  ═══════════════════════════');

    // 1. Test connection
    const connected = await testConnection();
    if (!connected) {
        console.error('  ❌ Cannot connect to database. Is PostgreSQL running on port 5433?');
        process.exit(1);
    }
    console.log('  ✅ Database connection OK');

    // 2. Run schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSQL);
    console.log('  ✅ Schema created');

    // 3. Clear existing data
    const tables = [
        'analytics_by_severity', 'analytics_by_type', 'analytics_daily', 'analytics_hourly',
        'alerts', 'events', 'sensors', 'drones', 'cameras', 'rules', 'users'
    ];
    for (const table of tables) {
        await pool.query(`DELETE FROM ${table}`);
    }
    console.log('  ✅ Tables cleared');

    // 4. Insert cameras
    for (const c of mockData.cameras) {
        await pool.query(
            `INSERT INTO cameras (id, name, industry, zone, type, protocol, resolution, status, lat, lng, ip, port, stream_url, fps, recording, night_vision, last_detection, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
            [c.id, c.name, c.industry, c.zone, c.type, c.protocol, c.resolution, c.status,
            c.coordinates.lat, c.coordinates.lng, c.ip, c.port, c.streamUrl,
            c.fps, c.recording, c.nightVision, c.lastDetection, c.createdAt]
        );
    }
    console.log(`  ✅ Cameras: ${mockData.cameras.length} rows`);

    // 5. Insert drones
    for (const d of mockData.drones) {
        await pool.query(
            `INSERT INTO drones (id, name, model, industry, assigned_zone, status, lat, lng, altitude, battery, speed, flight_time, stream_url, patrol_route, last_mission, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
            [d.id, d.name, d.model, d.industry, d.assignedZone, d.status,
            d.coordinates.lat, d.coordinates.lng, d.altitude, d.battery, d.speed, d.flightTime,
            d.streamUrl, JSON.stringify(d.patrolRoute), d.lastMission, d.createdAt]
        );
    }
    console.log(`  ✅ Drones: ${mockData.drones.length} rows`);

    // 6. Insert sensors
    for (const s of mockData.sensors) {
        await pool.query(
            `INSERT INTO sensors (id, name, type, industry, zone, status, lat, lng, value, unit, threshold, battery, protocol, last_reading, history, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
            [s.id, s.name, s.type, s.industry, s.zone, s.status,
            s.coordinates.lat, s.coordinates.lng, s.value, s.unit, s.threshold,
            s.battery, s.protocol, s.lastReading, JSON.stringify(s.history), s.createdAt]
        );
    }
    console.log(`  ✅ Sensors: ${mockData.sensors.length} rows`);

    // 7. Insert events
    for (const e of mockData.events) {
        await pool.query(
            `INSERT INTO events (id, timestamp, source, source_id, type, severity, description, industry, zone, acknowledged, metadata)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [e.id, e.timestamp, e.source, e.sourceId, e.type, e.severity,
            e.description, e.industry, e.zone, e.acknowledged, JSON.stringify(e.metadata)]
        );
    }
    console.log(`  ✅ Events: ${mockData.events.length} rows`);

    // 8. Insert alerts
    for (const a of mockData.alerts) {
        await pool.query(
            `INSERT INTO alerts (id, timestamp, rule_id, severity, title, description, sources, industry, zone, status, assigned_to, acknowledged_at, resolved_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [a.id, a.timestamp, a.ruleId, a.severity, a.title, a.description,
            JSON.stringify(a.sources), a.industry, a.zone, a.status,
            a.assignedTo, a.acknowledgedAt, a.resolvedAt]
        );
    }
    console.log(`  ✅ Alerts: ${mockData.alerts.length} rows`);

    // 9. Insert rules
    for (const r of mockData.rules) {
        await pool.query(
            `INSERT INTO rules (id, name, conditions, actions, severity, enabled, industry)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [r.id, r.name, JSON.stringify(r.conditions), r.actions, r.severity, r.enabled, r.industry]
        );
    }
    console.log(`  ✅ Rules: ${mockData.rules.length} rows`);

    // 10. Insert users
    for (const u of mockData.users) {
        await pool.query(
            `INSERT INTO users (id, username, full_name, email, role, status, avatar, last_login, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [u.id, u.username, u.fullName, u.email, u.role, u.status, u.avatar, u.lastLogin, u.createdAt]
        );
    }
    console.log(`  ✅ Users: ${mockData.users.length} rows`);

    // 11. Insert analytics
    const analytics = mockData.analytics;
    for (const h of analytics.hourly) {
        await pool.query(
            `INSERT INTO analytics_hourly (hour, detections, alerts, incidents) VALUES ($1,$2,$3,$4)`,
            [h.hour, h.detections, h.alerts, h.incidents]
        );
    }
    for (const d of analytics.daily) {
        await pool.query(
            `INSERT INTO analytics_daily (date, label, total_detections, total_alerts, avg_response_time, critical_incidents) VALUES ($1,$2,$3,$4,$5,$6)`,
            [d.date, d.label, d.totalDetections, d.totalAlerts, d.avgResponseTime, d.criticalIncidents]
        );
    }
    for (const t of analytics.byType) {
        await pool.query(
            `INSERT INTO analytics_by_type (type, count, color) VALUES ($1,$2,$3)`,
            [t.type, t.count, t.color]
        );
    }
    for (const s of analytics.bySeverity) {
        await pool.query(
            `INSERT INTO analytics_by_severity (severity, count, color) VALUES ($1,$2,$3)`,
            [s.severity, s.count, s.color]
        );
    }
    console.log('  ✅ Analytics seeded');

    console.log('');
    console.log('  🎉 Seed complete!');
    console.log('');

    await pool.end();
}

seed().catch(err => {
    console.error('  ❌ Seed failed:', err.message);
    process.exit(1);
});
