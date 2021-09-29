import { FC, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { Spinner } from 'reactstrap';
import { useTranslation } from 'react-i18next';

import { useAccountAPI } from './AccountAPI';
import { ValidationError, RateLimitingError } from '../common/API';

export interface ActivateAccountPageRouteProps {
    accountId: string;
}

const ActivateAccountPage: FC<RouteComponentProps<ActivateAccountPageRouteProps>> = (props) => {
    const accountId = props.match.params.accountId;

    const { t } = useTranslation();
    const { activateAccount } = useAccountAPI();
    const [loading, setLoading] = useState<boolean>(() => true);
    const [status, setStatus] = useState<string>(() => "");

    useEffect(() => {
        activateAccount(accountId)
            .then(() => {
                setStatus('success');
            })
            .catch(err => {
                if (err instanceof ValidationError) {
                    setStatus('fail');
                } else if (err instanceof RateLimitingError) {
                    setStatus('rateLimitingError');
                } else {
                    setStatus('serverError');
                }
            })
            .finally(() => {
                setLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let message = '';
    if (status === 'success') {
        message = t('activateAccountPage.success');
    } else if (status === 'fail') {
        message = t('activateAccountPage.fail');
    } else if (status === 'rateLimitingError') {
        message = t('activateAccountPage.rateLimitingError');
    } else if (status === 'serverError') {
        message = t('activateAccountPage.serverError');
    }

    return (<>
        <div className="d-flex justify-content-center m-4">
            <div className="text-center">
                {loading && <Spinner />}
                {!loading && <h2>{message}</h2>}
            </div>
        </div>
    </>);
};

export default ActivateAccountPage;
