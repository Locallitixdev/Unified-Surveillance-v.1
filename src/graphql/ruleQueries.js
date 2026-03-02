import { gql } from '@apollo/client';

export const GET_RULES = gql`
  query GetRules {
    rules {
      id
      name
      severity
      industry
      actions
      enabled
    }
  }
`;
