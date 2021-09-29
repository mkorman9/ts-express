import { FC, createContext, useContext } from 'react';

import { useSession } from '../../session/SessionProvider';
import { useLanguages } from '../../common/LanguagesProvider';
import { callGet, callPost } from '../../common/API';
import type { SessionData, SessionDataResponse } from '../../session/SessionAPI';

export interface OAuth2Provider {
    enabled: boolean;
    clientId: string;
}

export interface OAuth2Metadata {
    github: OAuth2Provider;
    state: string;
}

export interface OAuth2APIContextType {
    getMetadata: () => Promise<OAuth2Metadata>;
    performGithubCodeFlow: (code: string, state: string) => Promise<SessionData>;
}

const OAuth2APIContext = createContext<OAuth2APIContextType>({} as OAuth2APIContextType);

export const OAuth2APIProvider: FC = (props: any) => {
    const { session } = useSession();
    const accessToken = session.data.accessToken;

    const { currentLanguage } = useLanguages();

    const getMetadata = (): Promise<OAuth2Metadata> => {
        return callGet<OAuth2Metadata>('/api/v1/login/oauth2', {
        })
        .then(response => ({
            github: {
                enabled: response.data.github.enabled,
                clientId: response.data.github.clientId
            },
            state: response.data.state
        }));
    };

    const performGithubCodeFlow = (code: string, state: string): Promise<SessionData> => {
        return callPost<SessionDataResponse>('/api/v1/login/oauth2/github/code', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': session.isActive ? `Bearer ${accessToken}` : undefined
            },
            data: {
                code: code,
                language: currentLanguage.id,
                state: state
            }
        })
        .then(response => ({
            id:          response.data.id,
            accessToken: response.data.accessToken,
            roles:       new Set(response.data.roles),
        }));
    };

    return (
        <OAuth2APIContext.Provider value={{ 
            getMetadata, 
            performGithubCodeFlow 
        }}>
            {props.children}
        </OAuth2APIContext.Provider>
    );
};

export const useOAuth2API = () => useContext(OAuth2APIContext);
