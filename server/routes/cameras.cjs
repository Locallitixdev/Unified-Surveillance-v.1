const express = require('express');
const router = express.Router();
const { query } = require('../db/db.cjs');

// POST /api/cameras/batch — batch create
router.post('/batch', async (req, res) => {
    try {
        const cameras = req.body.cameras;
        if (!Array.isArray(cameras) || cameras.length === 0) {
            return res.status(400).json({ error: 'cameras array is required' });
        }

        const created = [];
        const errors = [];

        for (let i = 0; i < cameras.length; i++) {
            const b = cameras[i];
            try {
                if (!b.name || !b.streamUrl) {
                    errors.push({ row: i + 1, error: 'name and streamUrl are required', data: b });
                    continue;
                }
                const id = `CAM-${String(Date.now()).slice(-6)}-${String(i).padStart(3, '0')}`;
                await query(
                    `INSERT INTO cameras (id, name, industry, zone, type, protocol, resolution, status, stream_url, lat, lng)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                    [id, b.name, b.industry || 'general', b.zone || 'Default Zone',
                        b.type || 'Fixed', b.protocol || 'RTSP', b.resolution || '1080p',
                        b.status || 'online', b.streamUrl,
                        b.lat || null, b.lng || null]
                );
                const result = await query('SELECT * FROM cameras WHERE id = $1', [id]);
                created.push(mapCamera(result.rows[0]));
            } catch (err) {
                errors.push({ row: i + 1, error: err.message, data: b });
            }
        }

        res.status(201).json({
            total: cameras.length,
            created: created.length,
            failed: errors.length,
            data: created,
            errors
        });
    } catch (err) {
        console.error('[cameras] Batch error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/cameras — list with optional filters
router.get('/', async (req, res) => {
    try {
        const conditions = [];
        const params = [];
        let idx = 1;

        if (req.query.industry) { conditions.push(`industry = $${idx++}`); params.push(req.query.industry); }
        if (req.query.status) { conditions.push(`status = $${idx++}`); params.push(req.query.status); }
        if (req.query.zone) { conditions.push(`zone = $${idx++}`); params.push(req.query.zone); }
        if (req.query.type) { conditions.push(`type = $${idx++}`); params.push(req.query.type); }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await query(`SELECT * FROM cameras ${where} ORDER BY created_at DESC`, params);

        // Map snake_case → camelCase for frontend compatibility
        const data = result.rows.map(mapCamera);
        res.json({ total: data.length, data });
    } catch (err) {
        console.error('[cameras] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/cameras/:id
router.get('/:id', async (req, res) => {
    try {
        const result = await query('SELECT * FROM cameras WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Camera not found' });
        res.json(mapCamera(result.rows[0]));
    } catch (err) {
        console.error('[cameras] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/cameras/:id/nearby — get cameras, drones, and sensors near a specific camera
router.get('/:id/nearby', async (req, res) => {
    try {
        // 1. Get the target camera's coordinates
        const targetRes = await query('SELECT lat, lng FROM cameras WHERE id = $1', [req.params.id]);
        if (targetRes.rows.length === 0) return res.status(404).json({ error: 'Camera not found' });

        const target = targetRes.rows[0];
        if (!target.lat || !target.lng) {
            return res.json([]);
        }

        // 2. Fetch all potential nearby assets
        const [camerasRes, dronesRes, sensorsRes] = await Promise.all([
            query('SELECT id, name, status, lat, lng FROM cameras WHERE id != $1 AND lat IS NOT NULL AND lng IS NOT NULL', [req.params.id]),
            query('SELECT id, name, status, lat, lng FROM drones WHERE lat IS NOT NULL AND lng IS NOT NULL'),
            query('SELECT id, name, status, lat, lng FROM sensors WHERE lat IS NOT NULL AND lng IS NOT NULL')
        ]);

        // 3. Haversine calculation helper
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        // 4. Combine and calculate
        const allAssets = [
            ...camerasRes.rows.map(r => ({ ...r, assetType: 'camera' })),
            ...dronesRes.rows.map(r => ({ ...r, assetType: 'drone' })),
            ...sensorsRes.rows.map(r => ({ ...r, assetType: 'sensor' }))
        ];

        const nearby = allAssets.map(asset => {
            const dist = calculateDistance(target.lat, target.lng, asset.lat, asset.lng);
            return {
                id: asset.id,
                name: asset.name,
                status: asset.status,
                assetType: asset.assetType,
                distance: dist,
                distanceStr: dist < 1 ? Math.round(dist * 1000) + 'm' : dist.toFixed(1) + 'km'
            };
        })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10); // Return top 10 for unified view

        res.json(nearby);
    } catch (err) {
        console.error('[cameras] Nearby unified error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/cameras — create
router.post('/', async (req, res) => {
    try {
        const b = req.body;
        const id = `CAM-${String(Date.now()).slice(-4)}`;
        await query(
            `INSERT INTO cameras (id, name, industry, zone, type, protocol, resolution, status, stream_url, lat, lng)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [id, b.name, b.industry || 'general', b.zone, b.type || 'Fixed', b.protocol || 'RTSP',
                b.resolution || '1080p', b.status || 'online', b.streamUrl,
                b.lat || null, b.lng || null]
        );
        const result = await query('SELECT * FROM cameras WHERE id = $1', [id]);
        res.status(201).json(mapCamera(result.rows[0]));
    } catch (err) {
        console.error('[cameras] Create error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// PUT /api/cameras/:id — update
router.put('/:id', async (req, res) => {
    try {
        const b = req.body;
        const result = await query(
            `UPDATE cameras SET name=$2, zone=$3, type=$4, protocol=$5, resolution=$6, status=$7, stream_url=$8, lat=$9, lng=$10
             WHERE id=$1 RETURNING *`,
            [req.params.id, b.name, b.zone, b.type || 'Fixed', b.protocol || 'RTSP',
            b.resolution || '1080p', b.status, b.streamUrl || null,
            b.lat || null, b.lng || null]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Camera not found' });
        res.json(mapCamera(result.rows[0]));
    } catch (err) {
        console.error('[cameras] Update error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/cameras/:id
router.delete('/:id', async (req, res) => {
    try {
        const result = await query('DELETE FROM cameras WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Camera not found' });
        res.json({ deleted: true, id: req.params.id });
    } catch (err) {
        console.error('[cameras] Delete error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function mapCamera(row) {
    return {
        id: row.id,
        name: row.name,
        industry: row.industry,
        zone: row.zone,
        type: row.type,
        protocol: row.protocol,
        resolution: row.resolution,
        status: row.status,
        coordinates: { lat: row.lat, lng: row.lng },
        ip: row.ip,
        port: row.port,
        streamUrl: row.stream_url,
        fps: row.fps,
        recording: row.recording,
        nightVision: row.night_vision,
        lastDetection: row.last_detection,
        createdAt: row.created_at
    };
}

module.exports = router;
