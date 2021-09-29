import { FC, createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import { UnauthorizedError } from '../common/API';
import { usePrevious } from '../common/Utils';
import { useSessionAPI } from './SessionAPI';
import type { SessionData } from './SessionAPI';
import type { SessionStatus, SessionContextType } from './SessionProvider.d';

export type { SessionEventType, SessionStatus, SessionContextType } from './SessionProvider.d';

const SessionRefreshInterval: number = 60 * 1000;

const defaultSessionData: (() => SessionData) = () => ({
  id: "",
  accessToken: "",
  roles: new Set()
});
const defaultSessionStatus: (() => SessionStatus) = () => ({
  lastEvent: "loading",
  isActive: false,
  isStillLoading: true,
  data: defaultSessionData()
});

const Session = createContext<SessionContextType>({} as SessionContextType);

const SessionProvider: FC = (props: PropsWithChildren<unknown>) => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const prevSessionData = usePrevious<SessionData | null>(sessionData);
  const [session, setSession] = useState<SessionStatus>(() => defaultSessionStatus());
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  const { t } = useTranslation();
  const { getSessionStatus, refreshSession, terminateSession } = useSessionAPI();

  const newSession = (newSessionData: SessionData) => {
    setSessionData({
      id:          newSessionData.id,
      accessToken: newSessionData.accessToken,
      roles:       newSessionData.roles
    });
  };

  const endSession = (): Promise<void> => {
    if (sessionData) {
      return terminateSession(sessionData.accessToken)
        .then(() => {
          setSessionData(null);
        });
    }

    return Promise.reject(new UnauthorizedError([{
      field: "session",
      code: "missing"
    }]));
  };

  useEffect(() => {
    getSessionStatus()
      .then((sessionInfo) => {
        newSession(sessionInfo);
      })
      .catch(err => {
        if (err instanceof UnauthorizedError) {
          setSession({ lastEvent: 'not_loaded', isActive: false, isStillLoading: false, data: defaultSessionData() });
        } else {
          console.log(`Failed to retrieve session status: ${err}`);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const startRefreshTimer = () => {
      if (!sessionData) {
        return;
      }

      const timerId = setInterval(() => {
        refreshSession(sessionData.accessToken)
          .then((sessionInfo) => {
            newSession(sessionInfo);
          })
          .catch(err => {
            if (err instanceof UnauthorizedError) {
              toast.error(t('session.sessionEnded'), { autoClose: 4000, hideProgressBar: true, closeOnClick: true });
              setSessionData(null);
            } else {
              console.log(`Failed to refresh session: ${err}`);
            }
          });
      }, SessionRefreshInterval);

      setRefreshTimer(timerId);
    };

    if (!prevSessionData && sessionData) {
      setSession({ lastEvent: 'started', isActive: true, isStillLoading: false, data: sessionData });
      startRefreshTimer();
      return;
    }

    if (prevSessionData && !sessionData) {
      setSession({ lastEvent: 'terminated', isActive: false, isStillLoading: false, data: defaultSessionData() });

      if (refreshTimer) {
        clearInterval(refreshTimer);
        setRefreshTimer(null);
      }

      return;
    }

    if (prevSessionData && sessionData && prevSessionData.id !== sessionData.id) {
      setSession({ lastEvent: 'switched', isActive: true, isStillLoading: false, data: sessionData });

      if (refreshTimer) {
        clearInterval(refreshTimer);
      }

      startRefreshTimer();

      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionData]);

  const useActiveSession = (fn: (session: SessionStatus) => void) => {
    useEffect(() => {
      if (session.isActive && !session.isStillLoading) {
        fn(session);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);
  };

  const useMissingSession = (fn: () => void) => {
    useEffect(() => {
      if (!session.isActive && !session.isStillLoading) {
        fn();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);
  };

  const useSwitchedSession = (fn: (session: SessionStatus) => void) => {
    useEffect(() => {
      if (session.isActive && !session.isStillLoading && session.lastEvent === 'switched') {
        fn(session);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);
  };

  return (
    <Session.Provider value={{
      session,
      newSession,
      endSession,
      useActiveSession,
      useMissingSession,
      useSwitchedSession
    }}>
      {props.children}
    </Session.Provider>
  );
};

export const useSession: (() => SessionContextType) = () => useContext(Session);

export default SessionProvider;
