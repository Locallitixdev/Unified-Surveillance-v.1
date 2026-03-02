const express = require('express');
const router = express.Router();
const { query } = require('../db/db.cjs');

router.get('/', async (req, res) => {
    try {
        const conditions = [];
        const params = [];
        let idx = 1;

        if (req.query.severity) { conditions.push(`severity = $${idx++}`); params.push(req.query.severity); }
        if (req.query.status) { conditions.push(`status = $${idx++}`); params.push(req.query.status); }
        if (req.query.industry) { conditions.push(`industry = $${idx++}`); params.push(req.query.industry); }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await query(`SELECT * FROM alerts ${where} ORDER BY timestamp DESC`, params);
        const data = result.rows.map(mapAlert);
        res.json({ total: data.length, data });
    } catch (err) {
        console.error('[alerts] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await query('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });
        res.json(mapAlert(result.rows[0]));
    } catch (err) {
        console.error('[alerts] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:id/acknowledge', async (req, res) => {
    try {
        const result = await query(
            `UPDATE alerts SET status = 'acknowledged', acknowledged_at = NOW() WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });
        res.json(mapAlert(result.rows[0]));
    } catch (err) {
        console.error('[alerts] Acknowledge error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:id/resolve', async (req, res) => {
    try {
        const result = await query(
            `UPDATE alerts SET status = 'resolved', resolved_at = NOW() WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });
        res.json(mapAlert(result.rows[0]));
    } catch (err) {
        console.error('[alerts] Resolve error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function mapAlert(row) {
    return {
        id: row.id,
        timestamp: row.timestamp,
        ruleId: row.rule_id,
        severity: row.severity,
        title: row.title,
        description: row.description,
        sources: row.sources,
        industry: row.industry,
        zone: row.zone,
        status: row.status,
        assignedTo: row.assigned_to,
        acknowledgedAt: row.acknowledged_at,
        resolvedAt: row.resolved_at
    };
}

module.exports = router;
