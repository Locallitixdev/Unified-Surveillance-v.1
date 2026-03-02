import { ApolloLink, Observable } from '@apollo/client';
import { cameras, drones, sensors, missions, missionTelemetry, events, alerts, analyticsSummary, analytics, usersArr, rulesArr } from './mockData';

const mockLink = new ApolloLink((operation) => {
    const { operationName, variables } = operation;
    console.log(`[MockLink] Intercepted GraphQL Operation: ${operationName}`, variables);

    return new Observable((observer) => {
        (async () => {
            let data = {};

            switch (operationName) {
                case 'GetCameras':
                    try {
                        const res = await fetch('/api/cameras');
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const json = await res.json();
                        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
                        data = { cameras: list.length > 0 ? list : cameras };
                    } catch (err) {
                        console.error('Fetch cameras failed, using fallback:', err);
                        data = { cameras };
                    }
                    break;
                case 'GetDrones':
                    try {
                        const res = await fetch('/api/drones');
                        const json = await res.json();
                        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
                        data = { drones: list.length > 0 ? list : drones };
                    } catch { data = { drones }; }
                    break;
                case 'GetSensors':
                    try {
                        const res = await fetch('/api/sensors');
                        const json = await res.json();
                        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
                        data = { sensors: list.length > 0 ? list : sensors };
                    } catch { data = { sensors }; }
                    break;
                case 'GetMissions':
                    data = { missions: Array.isArray(missions) ? missions : [] };
                    break;
                case 'GetMissionTelemetry':
                    data = { missionTelemetry: missionTelemetry[variables.flightId] || [] };
                    break;
                case 'GetEvents':
                    try {
                        const params = new URLSearchParams();
                        if (variables.limit) params.append('limit', variables.limit);
                        const res = await fetch(`/api/events?${params.toString()}`);
                        const json = await res.json();
                        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
                        data = { events: list.length > 0 ? list : events };
                    } catch { data = { events }; }
                    break;
                case 'GetAlerts':
                    try {
                        const params = new URLSearchParams();
                        if (variables.status) params.append('status', variables.status);
                        const res = await fetch(`/api/alerts?${params.toString()}`);
                        const json = await res.json();
                        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
                        data = { alerts: list.length > 0 ? list : alerts };
                    } catch { data = { alerts }; }
                    break;
                case 'GetAnalyticsSummary':
                    try {
                        const res = await fetch('/api/analytics/summary');
                        const json = await res.json();
                        data = { analyticsSummary: (json && Object.keys(json).length > 0) ? json : analyticsSummary };
                    } catch { data = { analyticsSummary }; }
                    break;
                case 'GetAnalytics':
                    try {
                        const res = await fetch('/api/analytics');
                        const json = await res.json();
                        data = { analytics: (json && Object.keys(json).length > 0) ? json : analytics };
                    } catch { data = { analytics }; }
                    break;
                case 'GetUsers':
                    data = { users: usersArr };
                    break;
                case 'GetRules':
                    data = { rules: rulesArr };
                    break;

                // Camera mutations
                case 'AddCamera':
                    try {
                        const res = await fetch('/api/cameras', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(variables.input)
                        });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const json = await res.json();
                        data = { addCamera: json };
                    } catch (err) {
                        data = { addCamera: { id: `ERR-${Date.now()}`, name: 'Error' } };
                    }
                    break;
                case 'UpdateCamera':
                    try {
                        const res = await fetch(`/api/cameras/${variables.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(variables.input)
                        });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const json = await res.json();
                        data = { updateCamera: json };
                    } catch (err) {
                        data = { updateCamera: { id: variables.id, name: 'Error' } };
                    }
                    break;
                case 'DeleteCamera':
                    try {
                        await fetch(`/api/cameras/${variables.id}`, { method: 'DELETE' });
                        data = { deleteCamera: true };
                    } catch (err) {
                        data = { deleteCamera: false };
                    }
                    break;

                case 'AddDrone':
                    data = { addDrone: { id: `DRN-${Math.floor(Math.random() * 900) + 100}`, name: variables.input.name } };
                    break;
                case 'UpdateDrone':
                    data = { updateDrone: { id: variables.id, name: variables.input.name } };
                    break;
                case 'DeleteDrone':
                    data = { deleteDrone: true };
                    break;

                case 'AddSensor':
                    data = { addSensor: { id: `SNS-${Math.floor(Math.random() * 9000) + 1000}`, name: variables.input.name } };
                    break;
                case 'UpdateSensor':
                    data = { updateSensor: { id: variables.id, name: variables.input.name } };
                    break;
                case 'DeleteSensor':
                    data = { deleteSensor: true };
                    break;

                default:
                    console.warn(`[MockLink] No mock handler for operation: ${operationName}. Falling back to empty response.`);
                    data = {};
            }

            observer.next({ data });
            observer.complete();
        })();
    });
});

export default mockLink;
