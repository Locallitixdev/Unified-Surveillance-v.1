const express = require('express');
const router = express.Router();
const data = require('../data/mockData.cjs');

router.get('/', (req, res) => {
    let result = [...data.rules];
    if (req.query.industry) result = result.filter(r => r.industry === req.query.industry);
    if (req.query.enabled !== undefined) result = result.filter(r => r.enabled === (req.query.enabled === 'true'));
    res.json({ total: result.length, data: result });
});

router.get('/:id', (req, res) => {
    const rule = data.rules.find(r => r.id === req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    res.json(rule);
});

router.patch('/:id/toggle', (req, res) => {
    const rule = data.rules.find(r => r.id === req.params.id);
    if (!rule) return res.status(404).json({ error: 'Rule not found' });
    rule.enabled = !rule.enabled;
    res.json(rule);
});

module.exports = router;
