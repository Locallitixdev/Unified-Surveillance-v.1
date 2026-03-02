require('dotenv').config();
const { query } = require('./server/db/db.cjs');

async function debug() {
    try {
        console.log('--- CAMERAS ---');
        const cams = await query('SELECT id, name, stream_url FROM cameras LIMIT 5');
        console.log(JSON.stringify(cams.rows, null, 2));

        console.log('--- RECENT AI EVENTS ---');
        const events = await query("SELECT id, source_id, type, description, timestamp FROM events WHERE description LIKE '%AI%' ORDER BY timestamp DESC LIMIT 10");
        console.log(JSON.stringify(events.rows, null, 2));
    } catch (err) {
        console.error('Debug Error:', err.message);
    }
}

debug();
