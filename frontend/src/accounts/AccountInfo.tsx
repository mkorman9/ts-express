import { FC, createContext, useContext, useEffect, useState } from 'react';
import moment from 'moment';

import { useSession } from '../session/SessionProvider';
import { useAccountAPI } from './AccountAPI';
import { usePrevious } from '../common/Utils';
import type { AccountInfo } from './AccountAPI';
import type {
    AccountInfoStatus,
    AccountInfoContextType
} from './AccountInfo.d';

export type { 
    AccountInfoEventType,
    AccountInfoStatus,
    AccountInfoContextType
} from './AccountInfo.d';

const defaultAccountInfoData: (() => AccountInfo) = () => ({
    id: "",
    username: "",
    email: "",
    language: "en-US",
    registeredAt: moment.unix(0),
    roles: [],
    isActive: true,
    isBanned: false,
    bannedUntil: null,
    loginMethods: {
        emailAndPassword: {
            defined: false
        },
        github: {
            defined: false
        }
    }
});
const defaultAccountInfoStatus: (() => AccountInfoStatus) = () => ({
    lastEvent: "loading",
    isStillLoading: true,
    isLoadedValidInfo: false,
    data: defaultAccountInfoData()
});

const AccountInfoContext = createContext<AccountInfoContextType>({} as AccountInfoContextType);

const AccountInfoProvider: FC = (props: any) => {
    const { useActiveSession, useMissingSession } = useSession();
    const { getAccountInfo } = useAccountAPI();

    const [accountInfoData, setAccountInfoData] = useState<AccountInfo | null>(null);
    const prevAccountData = usePrevious<AccountInfo | null>(accountInfoData);
    const [accountInfo, setAccountInfo] = useState<AccountInfoStatus>(() => defaultAccountInfoStatus());
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    const reloadAccountInfo = () => {
        setIsDirty(true);
    };

    useActiveSession((_) => {
        reloadAccountInfo();
    });

    useMissingSession(() => {
        setAccountInfoData(null);
        setIsLoaded(true);
    });

    useEffect(() => {
        if (!isDirty) {
            return;
        }

        getAccountInfo()
            .then(newAccountInfo => {
                setAccountInfoData(newAccountInfo);
            })
            .catch(err => {
                console.log(`Failed to fetch account info: ${err}`);
                setAccountInfoData(null);
            })
            .finally(() => {
                setIsDirty(false);
                setIsLoaded(true);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDirty]);
    
    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        if (!prevAccountData && !accountInfoData) {
            setAccountInfo({
                lastEvent: "not_loaded",
                isStillLoading: false,
                isLoadedValidInfo: false,
                data: defaultAccountInfoData()
            });
            return;
        }

        if (!prevAccountData && accountInfoData) {
            setAccountInfo({
                lastEvent: "loaded",
                isStillLoading: false,
                isLoadedValidInfo: true,
                data: accountInfoData
            });
            return;
        }

        if (prevAccountData && !accountInfoData) {
            setAccountInfo({
                lastEvent: "unloaded",
                isStillLoading: false,
                isLoadedValidInfo: false,
                data: defaultAccountInfoData()
            });
            return;
        }

        if (prevAccountData && accountInfoData) {
            setAccountInfo({
                lastEvent: "reloaded",
                isStillLoading: false,
                isLoadedValidInfo: true,
                data: accountInfoData
            });
            return;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountInfoData, isLoaded]);

    const useLoadedAccountInfo = (fn: (accountInfo: AccountInfoStatus) => void) => {
        useEffect(() => {
            if (accountInfo.isLoadedValidInfo && !accountInfo.isStillLoading) {
                fn(accountInfo);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [accountInfo]);
    };

    const useReloadedAccountInfo = (fn: (accountInfo: AccountInfoStatus) => void) => {
        useEffect(() => {
            if (accountInfo.isLoadedValidInfo && !accountInfo.isStillLoading && accountInfo.lastEvent === 'reloaded') {
                fn(accountInfo);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [accountInfo]);
    };

    const useMissingAccountInfo = (fn: () => void) => {
        useEffect(() => {
            if (!accountInfo.isLoadedValidInfo && !accountInfo.isStillLoading) {
                fn();
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [accountInfo]);
    };

    return (
        <AccountInfoContext.Provider value={{ 
            accountInfo,
            useLoadedAccountInfo,
            useMissingAccountInfo,
            useReloadedAccountInfo,
            reloadAccountInfo 
        }}>
            {props.children}
        </AccountInfoContext.Provider>
    );
};

export const useAccountInfo = () => useContext(AccountInfoContext);

export default AccountInfoProvider;
