const express = require('express');
const router = express.Router();
const data = require('../data/mockData.cjs');

router.get('/', (req, res) => {
    let result = [...data.sensors];
    if (req.query.industry) result = result.filter(s => s.industry === req.query.industry);
    if (req.query.type) result = result.filter(s => s.type === req.query.type);
    if (req.query.status) result = result.filter(s => s.status === req.query.status);
    if (req.query.zone) result = result.filter(s => s.zone === req.query.zone);
    res.json({ total: result.length, data: result });
});

router.get('/:id', (req, res) => {
    const sensor = data.sensors.find(s => s.id === req.params.id);
    if (!sensor) return res.status(404).json({ error: 'Sensor not found' });
    res.json(sensor);
});

module.exports = router;
