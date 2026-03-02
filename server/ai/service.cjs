const { query } = require('../db/db.cjs');
const { pick, randFloat, randInt } = require('../data/mockData.cjs'); // Keeping for fallbacks
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AIService {
    constructor(wss) {
        this.wss = wss;
        this.activeSessions = new Map(); // cameraId -> intervalId
    }

    async startAnalysis(cameraId) {
        if (this.activeSessions.has(cameraId)) {
            console.log(`[AIService] Analysis already running for camera: ${cameraId}`);
            return;
        }

        console.log(`[AIService] Starting real-time analysis for camera: ${cameraId}`);

        // Initial detection
        this.triggerDetection(cameraId);

        // Set up periodic detection (every 5-10 seconds)
        const intervalId = setInterval(() => {
            this.triggerDetection(cameraId);
        }, randInt(5000, 10000));

        this.activeSessions.set(cameraId, intervalId);
    }

    async stopAnalysis(cameraId) {
        if (this.activeSessions.has(cameraId)) {
            console.log(`[AIService] Stopping analysis for camera: ${cameraId}`);
            clearInterval(this.activeSessions.get(cameraId));
            this.activeSessions.delete(cameraId);
        }
    }

    async triggerDetection(cameraId) {
        let cam;
        try {
            // 1. Get camera info
            const camRes = await query("SELECT id, name, zone, industry, stream_url FROM cameras WHERE id = $1", [cameraId]);
            cam = camRes.rows[0];
        } catch (dbErr) {
            console.warn(`[AIService] DB Query failed for camera ${cameraId}, using mock fallback:`, dbErr.message);
            // Fallback to mock data if DB is down
            const { cameras } = require('../data/mockData.cjs');
            const mockCam = cameras.find(c => c.id === cameraId);
            cam = mockCam ? { ...mockCam, stream_url: mockCam.streamUrl } : {
                id: cameraId,
                name: `Camera ${cameraId}`,
                zone: 'Default Zone',
                industry: 'Security',
                stream_url: 'https://restreamer5.kotabogor.go.id/memfs/807907af-8920-439d-9ae6-b67daa216818.m3u8'
            };
        }

        if (!cam) {
            console.error(`[AIService] Camera ${cameraId} not found (even in mocks)`);
            this.stopAnalysis(cameraId);
            return;
        }

        try {
            // 2. Spawn YOLO Worker
            const pythonPath = 'python'; // Assumes python is in PATH
            const scriptPath = path.join(__dirname, 'yolo_worker.py');

            console.log(`[AIService] Spawning YOLO worker: ${pythonPath} "${scriptPath}" "${cam.id}" "${cam.stream_url}"`);

            const pyProcess = spawn(pythonPath, [scriptPath, cam.id, cam.stream_url]);

            let outputData = '';
            let errorData = '';

            pyProcess.stdout.on('data', (data) => {
                const str = data.toString();
                outputData += str;
                console.log(`[YOLO-STDOUT] ${str.trim()}`);
            });

            pyProcess.stderr.on('data', (data) => {
                const str = data.toString();
                errorData += str;
                console.error(`[YOLO-STDERR] ${str.trim()}`);
            });

            pyProcess.on('error', (err) => {
                console.error(`[AIService] Failed to spawn YOLO process: ${err.message}`);
            });

            pyProcess.on('close', async (code) => {
                console.log(`[AIService] YOLO worker for ${cam.name} closed with code ${code}`);
                if (code !== 0) {
                    console.error(`[AIService] YOLO worker error output: ${errorData}`);
                    return;
                }

                try {
                    if (!outputData.trim()) {
                        console.warn(`[AIService] YOLO worker returned empty output`);
                        return;
                    }

                    // Robustly extract the JSON from potentially noisy output
                    // Find the outermost JSON block (greedy match from first { to last })
                    const jsonMatch = outputData.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        console.error(`[AIService] No JSON blocks found in worker output. Raw: ${outputData}`);
                        return;
                    }

                    const result = JSON.parse(jsonMatch[0]);

                    if (result.error) {
                        console.error(`[AIService] YOLO result error: ${result.error}`);
                        await this.saveAndBroadcastMock(cam, "motion_detected", "Motion detected (Detection Fallback)");
                        return;
                    }

                    if (result.detections && result.detections.length > 0) {
                        console.log(`[AIService] Grouping ${result.detections.length} objects for ${cam.name}: ${result.detections.map(d => d.class).join(', ')}`);
                        await this.saveDetectionEvent(cam, result.detections, result.imageUrl);
                    } else {
                        console.log(`[AIService] No objects detected for ${cam.name}`);
                    }
                } catch (err) {
                    console.error(`[AIService] Failed to parse YOLO output: ${err.message}. Raw output: ${outputData}`);
                }
            });
        } catch (err) {
            console.error('[AIService] Detection Error:', err.stack || err);
        }
    }

    async saveDetectionEvent(cam, detections, imageUrl) {
        // Group all detected classes (unique list)
        const detectedClasses = [...new Set(detections.map(d => d.class))];
        const primaryClass = detectedClasses[0] || 'Unknown';

        // Shorten to fit VARCHAR(20) in DB
        const eventId = `AI-${Date.now()}-${randInt(10, 99)}`;
        const timestamp = new Date().toISOString();

        // Use a generic type for grouped object detection
        const type = 'object_detection';

        const eventData = {
            id: eventId,
            timestamp,
            source: 'camera',
            sourceId: cam.id,
            type: type,
            severity: detections.some(d => d.confidence > 0.8) ? 'medium' : 'low',
            description: `[AI YOLO11] Object detection at ${cam.name}: ${detectedClasses.join(', ')}`,
            industry: cam.industry,
            zone: cam.zone,
            acknowledged: false,
            metadata: {
                detections: detections.map(d => ({ class: d.class, confidence: d.confidence })),
                detectedClasses: detectedClasses,
                imageUrl: imageUrl,
                model: 'ultralytics-yolo-v11',
                isRealtime: true
            }
        };

        await this.persistAndBroadcast(eventData);
    }

    async saveAndBroadcastMock(cam, type, desc) {
        const eventData = {
            id: `EVT-AI-FB-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: 'camera',
            sourceId: cam.id,
            type: type,
            severity: 'low',
            description: `[AI FALLBACK] ${desc} at ${cam.name}`,
            industry: cam.industry,
            zone: cam.zone,
            acknowledged: false,
            metadata: { confidence: 0.5, isFallback: true }
        };
        await this.persistAndBroadcast(eventData);
    }

    async persistAndBroadcast(eventData) {
        try {
            await query(
                `INSERT INTO events (id, timestamp, source, source_id, type, severity, description, industry, zone, acknowledged, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    eventData.id, eventData.timestamp, eventData.source, eventData.sourceId,
                    eventData.type, eventData.severity, eventData.description,
                    eventData.industry, eventData.zone, eventData.acknowledged, JSON.stringify(eventData.metadata)
                ]
            );
            console.log(`[AIService] Event persisted: ${eventData.id}`);
        } catch (dbErr) {
            console.error(`[AIService] DB Persistence Failed for ${eventData.id}:`, dbErr.message);
            // We continue to broadcast even if DB fails so live UI stays updated
        }

        if (this.wss) {
            let broadcastCount = 0;
            this.wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({ channel: 'event', data: eventData }));
                    broadcastCount++;
                }
            });
            console.log(`[AIService] Event ${eventData.id} broadcast to ${broadcastCount} clients`);
        } else {
            console.warn(`[AIService] No WSS instance found for broadcast`);
        }
    }
}

module.exports = AIService;
