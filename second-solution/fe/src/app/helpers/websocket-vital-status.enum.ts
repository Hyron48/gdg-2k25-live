export enum WebSocketVitalStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  ERROR = 'error',
  PREREQUISITE_NOT_MET = 'prerequisite_not_met'
}

export type WebSocketVitalStatusType =
  WebSocketVitalStatus.ACTIVE
  | WebSocketVitalStatus.CLOSED
  | WebSocketVitalStatus.ERROR
  | WebSocketVitalStatus.PREREQUISITE_NOT_MET;
