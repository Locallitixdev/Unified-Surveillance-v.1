import { useState } from 'react';
import { X } from 'lucide-react';

const SENSOR_TYPES = ['temperature', 'humidity', 'gas', 'vibration', 'motion', 'door', 'smoke', 'pressure', 'noise'];

/**
 * Modal form for adding/editing a sensor.
 * @param {Object} props
 * @param {Object|null} props.editingSensor - Sensor to edit, or null for new
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onSubmit - Submit callback with (input, isEdit)
 */
export function SensorModal({ editingSensor, onClose, onSubmit }) {
    const [formData, setFormData] = useState(editingSensor || {
        name: '',
        type: 'temperature',
        industry: 'oil_gas',
        zone: 'Main Hall',
        status: 'active',
        threshold: 50,
        unit: '°C'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const input = {
            name: formData.name,
            type: formData.type,
            industry: formData.industry,
            zone: formData.zone,
            status: formData.status,
            threshold: parseFloat(formData.threshold),
            unit: formData.unit
        };
        onSubmit(input, !!editingSensor);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{editingSensor ? 'Edit Sensor' : 'Add New Sensor'}</h2>
                    <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Sensor Name</label>
                        <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-grid-2col">
                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                {SENSOR_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Industry</label>
                            <select className="form-input" value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })}>
                                <option value="oil_gas">Oil & Gas</option>
                                <option value="warehouse">Warehouse</option>
                                <option value="smart_city">Smart City</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Zone</label>
                        <input className="form-input" value={formData.zone} onChange={e => setFormData({ ...formData, zone: e.target.value })} required />
                    </div>
                    <div className="form-grid-3col">
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Threshold</label>
                            <input type="number" className="form-input" value={formData.threshold} onChange={e => setFormData({ ...formData, threshold: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Unit</label>
                            <input className="form-input" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingSensor ? 'Update Sensor' : 'Add Sensor'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
