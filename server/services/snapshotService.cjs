const { query } = require('../db/db.cjs');
const { randInt } = require('../data/mockData.cjs');

/**
 * Snapshot Service
 * Handles periodic random camera snapshots every 1-2 hours.
 */
class SnapshotService {
    constructor(wss) {
        this.wss = wss;
        this.interval = null;
    }

    start() {
        console.log('[SnapshotService] Starting snapshot service (manual trigger only)...');

        // Initial run on server start
        this.performSnapshots();
    }

    async performSnapshots() {
        try {
            console.log('[SnapshotService] Performing random snapshots...');

            // 1. Get online cameras
            const res = await query("SELECT id, name, zone, industry FROM cameras WHERE status = 'online'");
            const cameras = res.rows;

            if (cameras.length === 0) {
                console.warn('[SnapshotService] No online cameras found for snapshots');
                return;
            }

            // 2. Pick 2-3 random cameras
            const count = randInt(2, 3);
            const shuffled = [...cameras].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, Math.min(count, cameras.length));

            for (const cam of selected) {
                const eventId = `EVT-SNAP-${Date.now()}-${randInt(1000, 9999)}`;
                const timestamp = new Date().toISOString();

                const eventData = {
                    id: eventId,
                    timestamp,
                    source: 'camera',
                    sourceId: cam.id,
                    type: 'periodic_snapshot',
                    severity: 'low',
                    description: `Automated high-resolution snapshot captured from ${cam.name}`,
                    industry: cam.industry,
                    zone: cam.zone,
                    acknowledged: true,
                    metadata: {
                        resolution: '4K',
                        storage_path: `/storage/snapshots/${cam.id}/${Date.now()}.jpg`,
                        trigger: 'timer'
                    }
                };

                // 3. Persist to DB
                await query(
                    `INSERT INTO events (id, timestamp, source, source_id, type, severity, description, industry, zone, acknowledged, metadata)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        eventData.id, eventData.timestamp, eventData.source, eventData.sourceId,
                        eventData.type, eventData.severity, eventData.description,
                        eventData.industry, eventData.zone, eventData.acknowledged, eventData.metadata
                    ]
                );

                // 4. Broadcast via WebSocket
                if (this.wss) {
                    this.wss.clients.forEach(client => {
                        if (client.readyState === 1) { // OPEN
                            client.send(JSON.stringify({
                                channel: 'event',
                                data: eventData
                            }));
                        }
                    });
                }

                console.log(`[SnapshotService] Snapshot event created for ${cam.id} (${cam.name})`);
            }
        } catch (err) {
            console.error('[SnapshotService] Error during snapshot performance:', err.message);
        }
    }

    stop() {
        if (this.interval) clearTimeout(this.interval);
        console.log('[SnapshotService] Stopped');
    }
}

module.exports = SnapshotService;
