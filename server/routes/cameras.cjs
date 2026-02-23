const express = require('express');
const router = express.Router();
const data = require('../data/mockData.cjs');

router.get('/', (req, res) => {
    let result = [...data.cameras];
    if (req.query.industry) result = result.filter(c => c.industry === req.query.industry);
    if (req.query.status) result = result.filter(c => c.status === req.query.status);
    if (req.query.zone) result = result.filter(c => c.zone === req.query.zone);
    if (req.query.type) result = result.filter(c => c.type === req.query.type);
    res.json({ total: result.length, data: result });
});

router.get('/:id', (req, res) => {
    const cam = data.cameras.find(c => c.id === req.params.id);
    if (!cam) return res.status(404).json({ error: 'Camera not found' });
    res.json(cam);
});

module.exports = router;
