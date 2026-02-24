import { gql } from '@apollo/client';

export const GET_CAMERAS = gql`
  query GetCameras {
    cameras {
      id
      name
      type
      protocol
      resolution
      zone
      industry
      status
      coordinates { lat lng }
      lastDetection
    }
  }
`;

export const ADD_CAMERA = gql`
  mutation AddCamera($input: CameraInput!) {
    addCamera(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_CAMERA = gql`
  mutation UpdateCamera($id: ID!, $input: CameraInput!) {
    updateCamera(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_CAMERA = gql`
  mutation DeleteCamera($id: ID!) {
    deleteCamera(id: $id)
  }
`;
