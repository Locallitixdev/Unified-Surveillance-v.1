import { gql } from '@apollo/client';

export const GET_DRONES = gql`
  query GetDrones {
    drones {
      id
      name
      model
      industry
      assignedZone
      status
      battery
      altitude
      speed
      flightTime
      coordinates { lat lng }
    }
  }
`;

export const ADD_DRONE = gql`
  mutation AddDrone($input: DroneInput!) {
    addDrone(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_DRONE = gql`
  mutation UpdateDrone($id: ID!, $input: DroneInput!) {
    updateDrone(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_DRONE = gql`
  mutation DeleteDrone($id: ID!) {
    deleteDrone(id: $id)
  }
`;
