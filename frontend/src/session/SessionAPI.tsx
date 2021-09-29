import { FC, createContext, useContext } from 'react';

import { callGet, callPost, callPut } from '../common/API';
import type { SessionData, SessionDataResponse, SessionAPIContextType } from './SessionAPI.d';

export type { SessionData, SessionDataResponse, SessionAPIContextType } from './SessionAPI.d';

const SessionAPIContext = createContext<SessionAPIContextType>({} as SessionAPIContextType);

export const SessionAPIProvider: FC = (props: any) => {
  const getSessionStatus = (): Promise<SessionData> => {
    return callGet<SessionDataResponse>(`/api/v1/login/session/token`, {
    })
      .then(response => ({
        id:          response.data.id,
        accessToken: response.data.accessToken,
        roles:       new Set(response.data.roles),
      }));
  };

  const refreshSession = (accessToken: string): Promise<SessionData> => {
    return callPut<SessionDataResponse>(`/api/v1/login/session/refresh`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then(response => ({
        id:          response.data.id,
        accessToken: response.data.accessToken,
        roles:       new Set(response.data.roles),
      }));
  };

  const terminateSession = (accessToken: string): Promise<void> => {
    return callPost(`/api/v1/login/session/revoke`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then(() => {
      });
  };

  return (
    <SessionAPIContext.Provider value={{
      getSessionStatus,
      refreshSession,
      terminateSession
    }}>
      {props.children}
    </SessionAPIContext.Provider>
  );
};

export const useSessionAPI = () => useContext(SessionAPIContext);
