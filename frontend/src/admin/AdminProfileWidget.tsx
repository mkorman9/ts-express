import { FC } from 'react';
import { Button } from 'reactstrap';
import { useHistory } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { useAdminAPI } from './AdminAPI';
import { useSession } from '../session/SessionProvider';
import { useAccountInfo } from '../accounts/AccountInfo';

export interface AdminProfileWidgetProps {
    accountId: string;
}

const AdminProfileWidget: FC<AdminProfileWidgetProps> = ({ accountId }) => {
    const { impersonate } = useAdminAPI();
    const { newSession, useSwitchedSession } = useSession();
    const { reloadAccountInfo } = useAccountInfo();
    const history = useHistory();
    const { t } = useTranslation();

    const handleImpersonate = () => {
        impersonate(accountId)
            .then(sessionInfo => {
                toast.success(t('adminProfileWidget.impersonateSuccess'), { autoClose: 2000, hideProgressBar: true, closeOnClick: true });
                newSession(sessionInfo);
            })
    };

    useSwitchedSession((_) => {
        reloadAccountInfo();
        history.push('/');
    });

    return (
        <div>
            <Button color="primary" onClick={handleImpersonate}>
                {t('adminProfileWidget.impersonate')}
            </Button>
        </div>
    );
};

export default AdminProfileWidget;
