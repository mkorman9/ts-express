import type { SessionData } from './SessionAPI';

export type SessionEventType = "loading" | "not_loaded" | "terminated" | "started" | "switched";

export interface SessionStatus {
  lastEvent: SessionEventType;
  isActive: boolean;
  isStillLoading: boolean;
  data: SessionData;
}

export interface SessionContextType {
  session: SessionStatus;
  newSession: (newSessionData: SessionData) => void;
  endSession: () => Promise<void>;
  useActiveSession: (fn: (session: SessionStatus) => void) => void;
  useMissingSession: (fn: () => void) => void;
  useSwitchedSession: (fn: (session: SessionStatus) => void) => void;
}
