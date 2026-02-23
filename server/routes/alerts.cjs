const express = require('express');
const router = express.Router();
const data = require('../data/mockData.cjs');

router.get('/', (req, res) => {
    let result = [...data.alerts];
    if (req.query.severity) result = result.filter(a => a.severity === req.query.severity);
    if (req.query.status) result = result.filter(a => a.status === req.query.status);
    if (req.query.industry) result = result.filter(a => a.industry === req.query.industry);
    res.json({ total: result.length, data: result });
});

router.get('/:id', (req, res) => {
    const alert = data.alerts.find(a => a.id === req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
});

router.patch('/:id/acknowledge', (req, res) => {
    const alert = data.alerts.find(a => a.id === req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    res.json(alert);
});

router.patch('/:id/resolve', (req, res) => {
    const alert = data.alerts.find(a => a.id === req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    res.json(alert);
});

module.exports = router;
