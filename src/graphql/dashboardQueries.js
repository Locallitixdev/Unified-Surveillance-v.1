import { gql } from '@apollo/client';

export const GET_EVENTS = gql`
  query GetEvents($limit: Int) {
    events(limit: $limit) {
      id
      timestamp
      source
      sourceId
      type
      severity
      description
      zone
    }
  }
`;

export const GET_ALERTS = gql`
  query GetAlerts($status: String) {
    alerts(status: $status) {
      id
      timestamp
      severity
      title
      description
      zone
      status
    }
  }
`;

export const GET_ANALYTICS_SUMMARY = gql`
  query GetAnalyticsSummary {
    analyticsSummary {
      camerasOnline
      criticalAlerts
      totalDetections
      dronesActive
      sensorsActive
      avgResponseTime
    }
  }
`;

export const GET_ANALYTICS = gql`
  query GetAnalytics {
    analytics {
      hourly {
        hour
        detections
        alerts
        incidents
      }
      daily {
        date
        label
        totalDetections
        totalAlerts
        avgResponseTime
        criticalIncidents
      }
      byType {
        type
        count
        color
      }
      bySeverity {
        severity
        count
        color
      }
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      username
      fullName
      email
      role
      status
      lastLogin
    }
  }
`;

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
