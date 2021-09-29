import { FC, createContext, useContext } from 'react';

import { callGet } from '../common/API';
import type { 
    CaptchaID, 
    CaptchaAPIContextType
} from './CaptchaAPI.d';

export type { 
    CaptchaID, 
    CaptchaAPIContextType,
    CaptchaAnswer
} from './CaptchaAPI.d';

const CaptchaAPIContext = createContext<CaptchaAPIContextType>({} as CaptchaAPIContextType);

export const CaptchaAPIProvider: FC = (props: any) => {
    const generateCaptcha = (): Promise<CaptchaID> => {
        return callGet<CaptchaID>('/api/v1/captcha/generate', {
        })
        .then(response => ({
            id: response.data.id
        }));
    };

    return (
        <CaptchaAPIContext.Provider value={{ generateCaptcha }}>
            {props.children}
        </CaptchaAPIContext.Provider>
    );
};

export const useCaptchaAPI = () => useContext(CaptchaAPIContext);
