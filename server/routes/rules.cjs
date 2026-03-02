const express = require('express');
const router = express.Router();
const { query } = require('../db/db.cjs');

router.get('/', async (req, res) => {
    try {
        const conditions = [];
        const params = [];
        let idx = 1;

        if (req.query.industry) { conditions.push(`industry = $${idx++}`); params.push(req.query.industry); }
        if (req.query.enabled !== undefined) {
            conditions.push(`enabled = $${idx++}`);
            params.push(req.query.enabled === 'true');
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await query(`SELECT * FROM rules ${where} ORDER BY id`, params);
        const data = result.rows.map(mapRule);
        res.json({ total: data.length, data });
    } catch (err) {
        console.error('[rules] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await query('SELECT * FROM rules WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
        res.json(mapRule(result.rows[0]));
    } catch (err) {
        console.error('[rules] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:id/toggle', async (req, res) => {
    try {
        const result = await query(
            `UPDATE rules SET enabled = NOT enabled WHERE id = $1 RETURNING *`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
        res.json(mapRule(result.rows[0]));
    } catch (err) {
        console.error('[rules] Toggle error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function mapRule(row) {
    return {
        id: row.id,
        name: row.name,
        conditions: row.conditions,
        actions: row.actions,
        severity: row.severity,
        enabled: row.enabled,
        industry: row.industry
    };
}

module.exports = router;
