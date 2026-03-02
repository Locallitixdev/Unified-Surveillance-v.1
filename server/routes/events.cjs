const express = require('express');
const router = express.Router();
const { query } = require('../db/db.cjs');

router.get('/', async (req, res) => {
    try {
        const conditions = [];
        const params = [];
        let idx = 1;

        if (req.query.severity) { conditions.push(`severity = $${idx++}`); params.push(req.query.severity); }
        if (req.query.type) { conditions.push(`type = $${idx++}`); params.push(req.query.type); }
        if (req.query.source) { conditions.push(`source = $${idx++}`); params.push(req.query.source); }
        if (req.query.industry) { conditions.push(`industry = $${idx++}`); params.push(req.query.industry); }
        if (req.query.sourceId) { conditions.push(`source_id = $${idx++}`); params.push(req.query.sourceId); }
        if (req.query.acknowledged !== undefined) {
            conditions.push(`acknowledged = $${idx++}`);
            params.push(req.query.acknowledged === 'true');
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const countResult = await query(`SELECT COUNT(*) FROM events ${where}`, params);
        const total = parseInt(countResult.rows[0].count);

        params.push(limit);
        params.push(offset);
        const result = await query(
            `SELECT * FROM events ${where} ORDER BY timestamp DESC LIMIT $${idx++} OFFSET $${idx++}`,
            params
        );

        const data = result.rows.map(mapEvent);
        res.json({ total, page, limit, data });
    } catch (err) {
        console.error('[events] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await query('SELECT * FROM events WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.json(mapEvent(result.rows[0]));
    } catch (err) {
        console.error('[events] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DEPRECATED: Snapshots moved to frontend
/*
router.post('/snapshots/trigger', async (req, res) => {
    try {
        const snapshotService = req.app.get('snapshotService');
        if (!snapshotService) return res.status(500).json({ error: 'Snapshot service not initialized' });

        console.log('[API] Triggering snapshots via dashboard refresh...');
        await snapshotService.performSnapshots();
        res.json({ success: true, message: 'Snapshots triggered' });
    } catch (err) {
        console.error('[events] Trigger Error:', err.message);
        res.status(500).json({ error: 'Failed to trigger snapshots' });
    }
});
*/

function mapEvent(row) {
    return {
        id: row.id,
        timestamp: row.timestamp,
        source: row.source,
        sourceId: row.source_id,
        type: row.type,
        severity: row.severity,
        description: row.description,
        industry: row.industry,
        zone: row.zone,
        acknowledged: row.acknowledged,
        metadata: row.metadata
    };
}

module.exports = router;
