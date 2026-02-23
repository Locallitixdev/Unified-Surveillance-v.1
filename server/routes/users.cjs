const express = require('express');
const router = express.Router();
const data = require('../data/mockData.cjs');

router.get('/', (req, res) => {
    const safeUsers = data.users.map(({ ...u }) => u);
    res.json({ total: safeUsers.length, data: safeUsers });
});

router.get('/:id', (req, res) => {
    const user = data.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

module.exports = router;
