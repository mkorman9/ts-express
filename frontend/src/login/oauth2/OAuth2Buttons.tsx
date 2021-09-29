import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormGroup } from 'reactstrap';
import { FaGithub } from 'react-icons/fa';

import { useOAuth2API, OAuth2Metadata } from './OAuth2API';
import './OAuth2Buttons.scss';

export interface OAuth2ButtonsProps {
    showGithub?: boolean;
}

const OAuth2Buttons: FC<OAuth2ButtonsProps> = ({ showGithub }) => {
    if (showGithub === undefined) {
        showGithub = true;
    }

    const { t } = useTranslation();

    const { getMetadata } = useOAuth2API();
    const [cachedMetadata, setCachedMetadata] = useState<OAuth2Metadata>(() => ({
        github: {
            enabled: false,
            clientId: ""
        },
        state: ""
    }));

    useEffect(() => {
        getMetadata()
            .then(metadata => {
                setCachedMetadata(metadata);
            })
            .catch(err => {
                console.log(`Error while retrieving OAuth2 metadata: ${err}`);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getGithubUrl = (): string => {
        return `https://github.com/login/oauth/authorize?scope=user:email&client_id=${cachedMetadata.github.clientId}&state=${cachedMetadata.state}`;
    };

    return (<>
        {(cachedMetadata.github.enabled && showGithub) && 
            <div className="oauth2-buttons-container">
                <FormGroup>
                    <a id="github-button" className="btn btn-block btn-social btn-github" href={getGithubUrl()}>
                        <span style={{marginTop: "-3px"}}><FaGithub /></span> {t('oauth2Buttons.signInGithubLabel')}
                    </a>
                </FormGroup>
            </div>
        }
    </>);
};

export default OAuth2Buttons;
