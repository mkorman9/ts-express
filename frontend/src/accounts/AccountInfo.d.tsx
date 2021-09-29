import type { AccountInfo } from './AccountAPI';

export type AccountInfoEventType = "loading" | "not_loaded" | "loaded" | "unloaded" | "reloaded";

export interface AccountInfoStatus {
    lastEvent: AccountInfoEventType;
    isStillLoading: boolean;
    isLoadedValidInfo: boolean;
    data: AccountInfo;
}

export interface AccountInfoContextType {
    accountInfo: AccountInfoStatus;
    useLoadedAccountInfo: (fn: (accountInfo: AccountInfoStatus) => void) => void;
    useReloadedAccountInfo: (fn: (accountInfo: AccountInfoStatus) => void) => void;
    useMissingAccountInfo: (fn: () => void) => void;
    reloadAccountInfo: () => void;
}
