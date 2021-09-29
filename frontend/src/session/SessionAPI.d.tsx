export interface SessionData {
    id: string;
    accessToken: string;
    roles: Set<string>;
};

export interface SessionDataResponse {
    id: string;
    accessToken: string;
    roles: string[];
};

export interface SessionAPIContextType {
    getSessionStatus: () => Promise<SessionData>;
    refreshSession: (accessToken: string) => Promise<SessionData>;
    terminateSession: (accessToken: string) => Promise<void>;
}
