const express = require('express');
const router = express.Router();
const data = require('../data/mockData.cjs');

router.get('/', (req, res) => {
    let result = [...data.events];
    if (req.query.severity) result = result.filter(e => e.severity === req.query.severity);
    if (req.query.type) result = result.filter(e => e.type === req.query.type);
    if (req.query.source) result = result.filter(e => e.source === req.query.source);
    if (req.query.industry) result = result.filter(e => e.industry === req.query.industry);
    if (req.query.acknowledged !== undefined) result = result.filter(e => e.acknowledged === (req.query.acknowledged === 'true'));

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const start = (page - 1) * limit;

    res.json({
        total: result.length,
        page,
        limit,
        data: result.slice(start, start + limit)
    });
});

router.get('/:id', (req, res) => {
    const event = data.events.find(e => e.id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
});

module.exports = router;
