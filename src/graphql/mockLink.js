import { ApolloLink, Observable } from '@apollo/client';
import { cameras, drones, sensors, missions, missionTelemetry, events, alerts, analyticsSummary, analytics, usersArr, rulesArr } from './mockData';

const mockLink = new ApolloLink((operation) => {
    const { operationName, variables } = operation;
    console.log(`[MockLink] Intercepted GraphQL Operation: ${operationName}`, variables);

    return new Observable((observer) => {
        let data = {};

        switch (operationName) {
            case 'GetCameras':
                data = { cameras };
                break;
            case 'GetDrones':
                data = { drones };
                break;
            case 'GetSensors':
                data = { sensors };
                break;
            case 'GetMissions':
                data = { missions };
                break;
            case 'GetMissionTelemetry':
                data = { missionTelemetry: missionTelemetry[variables.flightId] || [] };
                break;
            case 'GetEvents':
                data = { events: variables.limit ? events.slice(0, variables.limit) : events };
                break;
            case 'GetAlerts':
                data = { alerts: variables.status ? alerts.filter(a => a.status === variables.status) : alerts };
                break;
            case 'GetAnalyticsSummary':
                data = { analyticsSummary };
                break;
            case 'GetAnalytics':
                data = { analytics };
                break;
            case 'GetUsers':
                data = { users: usersArr };
                break;
            case 'GetRules':
                data = { rules: rulesArr };
                break;

            // Basic mock for mutations
            case 'AddCamera':
                data = { addCamera: { id: `CAM-${Math.floor(Math.random() * 9000) + 1000}`, name: variables.input.name } };
                break;
            case 'UpdateCamera':
                data = { updateCamera: { id: variables.id, name: variables.input.name } };
                break;
            case 'DeleteCamera':
                data = { deleteCamera: true };
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

        // Simulate network delay
        setTimeout(() => {
            observer.next({ data });
            observer.complete();
        }, 500);
    });
});

export default mockLink;
