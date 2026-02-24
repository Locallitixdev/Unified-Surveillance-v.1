import { gql } from '@apollo/client';

export const GET_MISSIONS = gql`
  query GetMissions {
    missions {
      id
      name
      status
      startTime
    }
  }
`;

export const GET_MISSION_TELEMETRY = gql`
  query GetMissionTelemetry($flightId: String!) {
    missionTelemetry(flightId: $flightId) {
      altitude
      velocity
      coordinates {
        lat
        lng
      }
      timestamp
    }
  }
`;
