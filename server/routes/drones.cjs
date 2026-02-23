const express = require('express');
const router = express.Router();
const data = require('../data/mockData.cjs');

router.get('/', (req, res) => {
    let result = [...data.drones];
    if (req.query.industry) result = result.filter(d => d.industry === req.query.industry);
    if (req.query.status) result = result.filter(d => d.status === req.query.status);
    res.json({ total: result.length, data: result });
});

router.get('/:id', (req, res) => {
    const drone = data.drones.find(d => d.id === req.params.id);
    if (!drone) return res.status(404).json({ error: 'Drone not found' });
    res.json(drone);
});

module.exports = router;
