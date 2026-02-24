import { gql } from '@apollo/client';

export const GET_SENSORS = gql`
  query GetSensors {
    sensors {
      id
      name
      type
      industry
      zone
      status
      value
      unit
      threshold
      battery
      protocol
      coordinates { lat lng }
      isAboveThreshold
      lastReading
    }
  }
`;

export const ADD_SENSOR = gql`
  mutation AddSensor($input: SensorInput!) {
    addSensor(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_SENSOR = gql`
  mutation UpdateSensor($id: ID!, $input: SensorInput!) {
    updateSensor(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_SENSOR = gql`
  mutation DeleteSensor($id: ID!) {
    deleteSensor(id: $id)
  }
`;
