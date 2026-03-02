const express = require('express');
const router = express.Router();

module.exports = (aiService) => {
    router.post('/start', async (req, res) => {
        const { cameraId } = req.body;
        console.log(`[AI-ROUTE] POST /api/ai/start received for camera: ${cameraId}`);
        if (!cameraId) return res.status(400).json({ error: 'cameraId is required' });
        try {
            await aiService.startAnalysis(cameraId);
            res.json({ success: true, message: `AI analysis started for ${cameraId}` });
        } catch (err) {
            console.error(`[AI-ROUTE] Start Error: ${err.message}`);
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/stop', async (req, res) => {
        const { cameraId } = req.body;
        if (!cameraId) return res.status(400).json({ error: 'cameraId is required' });
        try {
            await aiService.stopAnalysis(cameraId);
            res.json({ success: true, message: `AI analysis stopped for ${cameraId}` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
