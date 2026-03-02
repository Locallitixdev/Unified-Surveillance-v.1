const express = require('express');
const router = express.Router();
const { query } = require('../db/db.cjs');

router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM users ORDER BY id');
        const data = result.rows.map(mapUser);
        res.json({ total: data.length, data });
    } catch (err) {
        console.error('[users] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(mapUser(result.rows[0]));
    } catch (err) {
        console.error('[users] Error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function mapUser(row) {
    return {
        id: row.id,
        username: row.username,
        fullName: row.full_name,
        email: row.email,
        role: row.role,
        status: row.status,
        avatar: row.avatar,
        lastLogin: row.last_login,
        createdAt: row.created_at
    };
}

module.exports = router;
