import { FC, createContext, useContext } from 'react';
import moment from 'moment';

import { useSession } from '../session/SessionProvider';
import { useLanguages } from '../common/LanguagesProvider';
import { callGet, callPost } from '../common/API';
import type { CaptchaAnswer } from '../captcha/CaptchaAPI';
import type { 
    AccountInfo,
    PublicAccountInfo,
    AccountInfoResponse,
    PublicAccountInfoResponse,
    EditProfilePayload,
    EditProfileStatusResponse,
    AccountAPIContextType
} from './AccountAPI.d';

export type { 
    LoginMethod,
    LoginMethods,
    AccountInfo,
    PublicAccountInfo,
    LoginMethodResponse,
    LoginMethodsResponse,
    AccountInfoResponse,
    PublicAccountInfoResponse,
    AccountsFilters,
    AccountsInfoPage,
    AccountsInfoPageResponse,
    EditProfilePayload,
    EditProfileStatusResponse,
    AccountAPIContextType
} from './AccountAPI.d';

const AccountAPIContext = createContext<AccountAPIContextType>({} as AccountAPIContextType);

export const AccountAPIProvider: FC = (props: any) => {
    const { currentLanguage } = useLanguages();
    const { session } = useSession();
    const accessToken = session.data.accessToken;

    const getAccountInfo = (): Promise<AccountInfo> => {
        return callGet<AccountInfoResponse>('/api/v1/login/account/info', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => {
            const accountInfo = response.data;
            return {
                id: accountInfo.id,
                username: accountInfo.username,
                email: accountInfo.email,
                language: accountInfo.language,
                registeredAt: moment.utc(accountInfo.registeredAt),
                roles: accountInfo.roles || [],
                isActive: accountInfo.isActive,
                isBanned: accountInfo.isBanned,
                bannedUntil: (accountInfo.bannedUntil) ? moment.utc(accountInfo.bannedUntil) : null,
                loginMethods: {
                    emailAndPassword: {
                        defined: Boolean(accountInfo.loginMethods.emailAndPassword.defined)
                    },
                    github: {
                        defined: Boolean(accountInfo.loginMethods.github.defined)
                    }
                }
            };
        });
    };

    const getPublicAccountInfoByUsername = (username: string): Promise<PublicAccountInfo> => {
        return callGet<PublicAccountInfoResponse>(`/api/v1/login/account/info/username/${username}`, {
        })
        .then(response => {
            const publicAccountInfo = response.data;
            return {
                id: publicAccountInfo.id,
                username: publicAccountInfo.username,
                language: publicAccountInfo.language,
                registeredAt: moment.utc(publicAccountInfo.registeredAt),
                roles: publicAccountInfo.roles || [],
                isBanned: publicAccountInfo.isBanned,
                bannedUntil: (publicAccountInfo.bannedUntil) ? moment.utc(publicAccountInfo.bannedUntil) : null
            };
        });
    };

    const getPublicAccountInfoByID = (id: string): Promise<PublicAccountInfo> => {
        return callGet<PublicAccountInfoResponse>(`/api/v1/login/account/info/id/${id}`, {
        })
        .then(response => {
            const publicAccountInfo = response.data;
            return {
                id: publicAccountInfo.id,
                username: publicAccountInfo.username,
                language: publicAccountInfo.language,
                registeredAt: moment.utc(publicAccountInfo.registeredAt),
                roles: publicAccountInfo.roles || [],
                isBanned: publicAccountInfo.isBanned,
                bannedUntil: (publicAccountInfo.bannedUntil) ? moment.utc(publicAccountInfo.bannedUntil) : null
            };
        });
    };

    const activateAccount = (accountId: string): Promise<void> => {
        return callPost('/api/v1/login/account/activate', {
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                accountID: accountId
            }
        })
        .then(() => {
        });
    };

    const requestPasswordReset = (email: string, captcha: CaptchaAnswer): Promise<void> => {
        return callPost('/api/v1/login/account/password/reset', {
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                email: email, 
                captcha: {
                    id: captcha.id,
                    answer: captcha.answer
                }
            }
        })
        .then(() => {
        });
    };

    const setNewPassword = (password: string, accountId?: string, code?: string): Promise<void> => {
        let path = '/api/v1/login/account/password/set';
        const headers: HeadersInit = new Headers();

        headers.set('Content-Type', 'application/json');

        if (accountId && code) {
            path = `${path}/${accountId}/${code}`;
        } else {
            headers.set('Authorization', `Bearer ${accessToken}`);
        }

        return callPost(path, {
            headers: headers,
            data: {
                password: password
            }
        })
        .then(() => {
        });
    };

    const changeEmail = (accountId: string, code: string): Promise<void> => {
        return callPost('/api/v1/login/account/email/change', {
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                id: code, 
                accountID: accountId
            }
        })
        .then(() => {
        });
    };

    const registerNewAccount = (username: string, email: string, password: string, captcha: CaptchaAnswer): Promise<void> => {
        return callPost('/api/v1/login/account/register/password', {
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                username: username, 
                email: email, 
                password: password,
                language: currentLanguage.id,
                captcha: {
                    id: captcha.id,
                    answer: captcha.answer
                }
            }
        })
        .then(() => {
        });
    };

    const editProfile = (payload: EditProfilePayload): Promise<EditProfileStatusResponse> => {
        return callPost<EditProfileStatusResponse>('/api/v1/login/account/edit', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            data: {
                username: (!payload.username) ? undefined : {
                    username: payload.username
                },
                email: (!payload.email) ? undefined : {
                    email: payload.email
                },
                language: (!payload.language) ? undefined : {
                    id: payload.language
                },
                password: (!payload.password) ? undefined : {
                    oldPassword: payload.password.oldPassword,
                    newPassword: payload.password.newPassword
                },
            }
        })
        .then(response => ({
            username: {
                isModified: response.data.username.isModified,
                causes: (!response.data.username.causes) ? [] : response.data.username.causes.map(cause => ({
                    field: cause.field,
                    code: cause.code
                })),
                isServerError: response.data.username.isServerError
            },
            email: {
                isModified: response.data.email.isModified,
                causes: (!response.data.email.causes) ? [] : response.data.email.causes.map(cause => ({
                    field: cause.field,
                    code: cause.code
                })),
                isServerError: response.data.email.isServerError
            },
            language: {
                isModified: response.data.language.isModified,
                causes: (!response.data.language.causes) ? [] : response.data.language.causes.map(cause => ({
                    field: cause.field,
                    code: cause.code
                })),
                isServerError: response.data.language.isServerError
            },
            password: {
                isModified: response.data.password.isModified,
                causes: (!response.data.password.causes) ? [] : response.data.password.causes.map(cause => ({
                    field: cause.field,
                    code: cause.code
                })),
                isServerError: response.data.password.isServerError
            }
        }));
    };

    return (
        <AccountAPIContext.Provider value={{
            getAccountInfo,
            getPublicAccountInfoByUsername,
            getPublicAccountInfoByID,
            activateAccount,
            requestPasswordReset,
            setNewPassword,
            changeEmail,
            registerNewAccount,
            editProfile
        }}>
            {props.children}
        </AccountAPIContext.Provider>
    );
};

export const useAccountAPI = () => useContext(AccountAPIContext);
