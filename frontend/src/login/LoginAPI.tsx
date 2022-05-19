import { FC, createContext, useContext, PropsWithChildren } from 'react';

import { callPost } from '../common/API';
import type { SessionData, SessionDataResponse } from '../session/SessionAPI';

export interface LoginAPIContextType {
  authWithPassword: (email: string, password: string, rememberMe: boolean) => Promise<SessionData>;
}

const LoginAPIContext = createContext<LoginAPIContextType>({} as LoginAPIContextType);

export const LoginAPIProvider: FC = (props: PropsWithChildren<unknown>) => {
  const authWithPassword = (email: string, password: string, rememberMe: boolean): Promise<SessionData> => {
    return callPost<SessionDataResponse>(`/api/v1/session${rememberMe ? '?rememberMe' : ''}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        email: email,
        password: password
      }
    })
      .then(response => ({
        id:          response.data.id,
        accessToken: response.data.accessToken,
        roles:       new Set(response.data.roles),
      }));
  };

  return (
    <LoginAPIContext.Provider value={{
      authWithPassword
    }}>
      {props.children}
    </LoginAPIContext.Provider>
  );
};

export const useLoginAPI: (() => LoginAPIContextType) = () => useContext(LoginAPIContext);
