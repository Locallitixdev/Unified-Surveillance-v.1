import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Download, Plus, Trash2 } from 'lucide-react';

const TEMPLATE_CSV = `name,type,protocol,resolution,zone,lat,lng,streamUrl,status
Simpang Yasmin,Fixed,RTSP,1080p,Bogor,-6.555814562726495,106.77896933902507,https://restreamer5.kotabogor.go.id/memfs/fa74138a-dd7e-4f10-8174-69475584073d.m3u8,online
Taman Sempur,PTZ,ONVIF,4K,Bogor,-6.5945,106.7972,https://restreamer5.kotabogor.go.id/memfs/abc123.m3u8,online
Alun-Alun Kota,Dome,RTSP,1080p,Bogor,-6.5963,106.7958,https://restreamer5.kotabogor.go.id/memfs/def456.m3u8,online`;

const TEMPLATE_JSON = `[
  {
    "name": "Simpang Yasmin",
    "type": "Fixed",
    "protocol": "RTSP",
    "resolution": "1080p",
    "zone": "Bogor",
    "lat": -6.555814562726495,
    "lng": 106.77896933902507,
    "streamUrl": "https://restreamer5.kotabogor.go.id/memfs/fa74138a-dd7e-4f10-8174-69475584073d.m3u8",
    "status": "online"
  }
]`;

function parseCSV(text) {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        if (obj.location && !obj.zone) { obj.zone = obj.location; delete obj.location; }
        return obj;
    });
}

function parseJSON(text) {
    try {
        const data = JSON.parse(text);
        const arr = Array.isArray(data) ? data : [data];
        return arr.map(item => {
            if (item.location && !item.zone) { item.zone = item.location; delete item.location; }
            return item;
        });
    } catch {
        return null;
    }
}

export default function BatchUploadModal({ onClose, onComplete }) {
    const [mode, setMode] = useState('paste');
    const [format, setFormat] = useState('csv');
    const [textInput, setTextInput] = useState('');
    const [manualRows, setManualRows] = useState([
        { name: '', type: 'Fixed', protocol: 'RTSP', resolution: '1080p', zone: '', lat: '', lng: '', streamUrl: '', status: 'online' }
    ]);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const fileRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setTextInput(ev.target.result);
            setFormat(file.name.endsWith('.json') ? 'json' : 'csv');
        };
        reader.readAsText(file);
    };

    const addManualRow = () => {
        setManualRows(prev => [...prev, { name: '', type: 'Fixed', protocol: 'RTSP', resolution: '1080p', zone: '', lat: '', lng: '', streamUrl: '', status: 'online' }]);
    };

    const updateManualRow = (idx, field, value) => {
        setManualRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    };

    const removeManualRow = (idx) => {
        setManualRows(prev => prev.filter((_, i) => i !== idx));
    };

    const handleUpload = async () => {
        setError('');
        let cameras;

        if (mode === 'paste') {
            if (!textInput.trim()) { setError('Please paste or upload data'); return; }
            if (format === 'csv') {
                cameras = parseCSV(textInput);
                if (cameras.length === 0) { setError('No valid rows found in CSV'); return; }
            } else {
                cameras = parseJSON(textInput);
                if (!cameras) { setError('Invalid JSON format'); return; }
            }
        } else {
            cameras = manualRows.filter(r => r.name && r.streamUrl);
            if (cameras.length === 0) { setError('Add at least one camera with name and stream URL'); return; }
        }

        setUploading(true);
        try {
            const resp = await fetch('/api/cameras/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cameras })
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Upload failed');
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const content = format === 'csv' ? TEMPLATE_CSV : TEMPLATE_JSON;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `camera_template.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal batch-upload-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><Upload size={20} /> Batch Upload CCTV</h2>
                    <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                {result ? (
                    <div className="batch-result">
                        <div className="batch-result-icon">
                            <CheckCircle size={48} style={{ color: 'var(--accent-green)' }} />
                        </div>
                        <h3>Upload Complete</h3>
                        <div className="batch-result-stats">
                            <div className="batch-stat success">
                                <span className="batch-stat-num">{result.created}</span>
                                <span>Created</span>
                            </div>
                            <div className="batch-stat error">
                                <span className="batch-stat-num">{result.failed}</span>
                                <span>Failed</span>
                            </div>
                            <div className="batch-stat total">
                                <span className="batch-stat-num">{result.total}</span>
                                <span>Total</span>
                            </div>
                        </div>
                        {result.errors?.length > 0 && (
                            <div className="batch-errors">
                                <p style={{ color: 'var(--accent-red)', fontSize: '13px', marginBottom: '8px' }}>
                                    <AlertCircle size={14} /> Failed rows:
                                </p>
                                {result.errors.map((e, i) => (
                                    <div key={i} className="batch-error-item">
                                        Row {e.row}: {e.error}
                                    </div>
                                ))}
                            </div>
                        )}
                        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => { onComplete(); onClose(); }}>
                            Done
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="batch-mode-tabs">
                            <button className={`batch-tab ${mode === 'paste' ? 'active' : ''}`} onClick={() => setMode('paste')}>
                                <FileText size={14} /> Paste / File
                            </button>
                            <button className={`batch-tab ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
                                <Plus size={14} /> Manual Entry
                            </button>
                        </div>

                        {mode === 'paste' ? (
                            <div className="batch-paste-section">
                                <div className="batch-format-row">
                                    <div className="batch-format-select">
                                        <button className={`batch-fmt ${format === 'csv' ? 'active' : ''}`} onClick={() => setFormat('csv')}>CSV</button>
                                        <button className={`batch-fmt ${format === 'json' ? 'active' : ''}`} onClick={() => setFormat('json')}>JSON</button>
                                    </div>
                                    <div className="batch-actions-row">
                                        <button className="btn-ghost text-xs" onClick={downloadTemplate}>
                                            <Download size={13} /> Template
                                        </button>
                                        <button className="btn-ghost text-xs" onClick={() => fileRef.current?.click()}>
                                            <Upload size={13} /> Upload File
                                        </button>
                                        <input ref={fileRef} type="file" accept=".csv,.json,.txt" onChange={handleFileUpload} hidden />
                                    </div>
                                </div>
                                <textarea
                                    className="batch-textarea"
                                    placeholder={format === 'csv'
                                        ? 'name,type,protocol,resolution,zone,lat,lng,streamUrl\nSimpang Yasmin,Fixed,RTSP,1080p,Bogor,-6.55,106.77,https://...'
                                        : '[{ "name": "Simpang Yasmin", "type": "Fixed", "protocol": "RTSP", "resolution": "1080p", "zone": "Bogor", ... }]'}
                                    value={textInput}
                                    onChange={e => setTextInput(e.target.value)}
                                    rows={10}
                                />
                                <p className="batch-hint">
                                    Required: <strong>name</strong>, <strong>streamUrl</strong>. Optional: type, protocol, resolution, zone, lat, lng, status
                                </p>
                            </div>
                        ) : (
                            <div className="batch-manual-section">
                                <div className="batch-manual-table">
                                    <div className="batch-manual-header">
                                        <span>Name *</span>
                                        <span>Type</span>
                                        <span>Proto</span>
                                        <span>Res</span>
                                        <span>Zone</span>
                                        <span>Lat</span>
                                        <span>Lng</span>
                                        <span>Stream URL *</span>
                                        <span></span>
                                    </div>
                                    {manualRows.map((row, i) => (
                                        <div key={i} className="batch-manual-row">
                                            <input placeholder="Simpang Yasmin" value={row.name} onChange={e => updateManualRow(i, 'name', e.target.value)} />
                                            <select value={row.type} onChange={e => updateManualRow(i, 'type', e.target.value)}>
                                                <option>Fixed</option><option>PTZ</option><option>Dome</option><option>Bullet</option><option>Thermal</option>
                                            </select>
                                            <select value={row.protocol} onChange={e => updateManualRow(i, 'protocol', e.target.value)}>
                                                <option>RTSP</option><option>ONVIF</option><option>RTMP</option><option>HTTP</option>
                                            </select>
                                            <select value={row.resolution} onChange={e => updateManualRow(i, 'resolution', e.target.value)}>
                                                <option>1080p</option><option>4K</option><option>720p</option><option>4K UHD</option>
                                            </select>
                                            <input placeholder="Bogor" value={row.zone} onChange={e => updateManualRow(i, 'zone', e.target.value)} />
                                            <input placeholder="-6.55" type="number" step="any" value={row.lat} onChange={e => updateManualRow(i, 'lat', e.target.value)} />
                                            <input placeholder="106.77" type="number" step="any" value={row.lng} onChange={e => updateManualRow(i, 'lng', e.target.value)} />
                                            <input placeholder="https://..." value={row.streamUrl} onChange={e => updateManualRow(i, 'streamUrl', e.target.value)} />
                                            <button className="btn-ghost btn-icon" onClick={() => removeManualRow(i)} disabled={manualRows.length <= 1}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button className="btn-ghost text-xs" onClick={addManualRow} style={{ marginTop: '8px' }}>
                                    <Plus size={14} /> Add Row
                                </button>
                            </div>
                        )}

                        {error && <div className="batch-error-msg"><AlertCircle size={14} /> {error}</div>}

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                                <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Cameras'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
