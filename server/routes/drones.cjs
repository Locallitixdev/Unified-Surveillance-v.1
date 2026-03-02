const express = require('express');
const router = express.Router();
const { query } = require('../db/db.cjs');

router.get('/', async (req, res) => {
    try {
        const conditions = [];
        const params = [];
        let idx = 1;

        if (req.query.industry) { conditions.push(`industry = $${idx++}`); params.push(req.query.industry); }
        if (req.query.status) { conditions.push(`status = $${idx++}`); params.push(req.query.status); }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await query(`SELECT * FROM drones ${where} ORDER BY created_at DESC`, params);
        const data = result.rows.map(mapDrone);
        res.json({ total: data.length, data });
    } catch (err) {
        console.error('[drones] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await query('SELECT * FROM drones WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Drone not found' });
        res.json(mapDrone(result.rows[0]));
    } catch (err) {
        console.error('[drones] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const b = req.body;
        const id = `DRN-${String(Date.now()).slice(-3)}`;
        await query(
            `INSERT INTO drones (id, name, model, industry, assigned_zone, status)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [id, b.name, b.model, b.industry, b.assignedZone, b.status || 'docked']
        );
        const result = await query('SELECT * FROM drones WHERE id = $1', [id]);
        res.status(201).json(mapDrone(result.rows[0]));
    } catch (err) {
        console.error('[drones] Create error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const b = req.body;
        const result = await query(
            `UPDATE drones SET name=$2, model=$3, assigned_zone=$4, status=$5 WHERE id=$1 RETURNING *`,
            [req.params.id, b.name, b.model, b.assignedZone, b.status]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Drone not found' });
        res.json(mapDrone(result.rows[0]));
    } catch (err) {
        console.error('[drones] Update error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await query('DELETE FROM drones WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Drone not found' });
        res.json({ deleted: true, id: req.params.id });
    } catch (err) {
        console.error('[drones] Delete error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function mapDrone(row) {
    return {
        id: row.id,
        name: row.name,
        model: row.model,
        industry: row.industry,
        assignedZone: row.assigned_zone,
        status: row.status,
        coordinates: { lat: row.lat, lng: row.lng },
        altitude: row.altitude,
        battery: row.battery,
        speed: row.speed,
        flightTime: row.flight_time,
        streamUrl: row.stream_url,
        patrolRoute: row.patrol_route,
        lastMission: row.last_mission,
        createdAt: row.created_at
    };
}

module.exports = router;
