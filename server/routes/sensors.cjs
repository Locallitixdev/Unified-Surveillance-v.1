const express = require('express');
const router = express.Router();
const { query } = require('../db/db.cjs');

router.get('/', async (req, res) => {
    try {
        const conditions = [];
        const params = [];
        let idx = 1;

        if (req.query.industry) { conditions.push(`industry = $${idx++}`); params.push(req.query.industry); }
        if (req.query.type) { conditions.push(`type = $${idx++}`); params.push(req.query.type); }
        if (req.query.status) { conditions.push(`status = $${idx++}`); params.push(req.query.status); }
        if (req.query.zone) { conditions.push(`zone = $${idx++}`); params.push(req.query.zone); }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await query(`SELECT * FROM sensors ${where} ORDER BY created_at DESC`, params);
        const data = result.rows.map(mapSensor);
        res.json({ total: data.length, data });
    } catch (err) {
        console.error('[sensors] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await query('SELECT * FROM sensors WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Sensor not found' });
        res.json(mapSensor(result.rows[0]));
    } catch (err) {
        console.error('[sensors] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const b = req.body;
        const id = `SNS-${String(Date.now()).slice(-4)}`;
        await query(
            `INSERT INTO sensors (id, name, type, industry, zone, status, unit, threshold)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [id, b.name, b.type, b.industry, b.zone, b.status || 'active', b.unit, b.threshold]
        );
        const result = await query('SELECT * FROM sensors WHERE id = $1', [id]);
        res.status(201).json(mapSensor(result.rows[0]));
    } catch (err) {
        console.error('[sensors] Create error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const b = req.body;
        const result = await query(
            `UPDATE sensors SET name=$2, type=$3, zone=$4, status=$5, threshold=$6, unit=$7 WHERE id=$1 RETURNING *`,
            [req.params.id, b.name, b.type, b.zone, b.status, b.threshold, b.unit]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Sensor not found' });
        res.json(mapSensor(result.rows[0]));
    } catch (err) {
        console.error('[sensors] Update error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await query('DELETE FROM sensors WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Sensor not found' });
        res.json({ deleted: true, id: req.params.id });
    } catch (err) {
        console.error('[sensors] Delete error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function mapSensor(row) {
    return {
        id: row.id,
        name: row.name,
        type: row.type,
        industry: row.industry,
        zone: row.zone,
        status: row.status,
        coordinates: { lat: row.lat, lng: row.lng },
        value: row.value,
        unit: row.unit,
        threshold: row.threshold,
        isAboveThreshold: row.value > row.threshold,
        battery: row.battery,
        protocol: row.protocol,
        lastReading: row.last_reading,
        history: row.history,
        createdAt: row.created_at
    };
}

module.exports = router;
