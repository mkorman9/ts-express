import { FC } from 'react';
import { useHistory, RouteComponentProps } from 'react-router';
import { Spinner } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { useAccountAPI } from './AccountAPI';
import { useAccountInfo } from './AccountInfo';
import { ValidationError, RateLimitingError } from '../common/API';

export interface ChangeEmailPageRouteProps {
  accountId: string;
  code: string;
}

const ChangeEmailPage: FC<RouteComponentProps<ChangeEmailPageRouteProps>> = (props) => {
  const accountId = props.match.params.accountId;
  const code = props.match.params.code;

  const { t } = useTranslation();
  const history = useHistory();
  const { changeEmail } = useAccountAPI();
  const { useLoadedAccountInfo, useReloadedAccountInfo, useMissingAccountInfo, reloadAccountInfo } = useAccountInfo();

  useLoadedAccountInfo((accountInfo) => {
    if (accountInfo.lastEvent === 'reloaded') {
      return;
    }

    changeEmail(accountId, code)
      .then(() => {
        toast.success(t('changeEmailPage.success'));
        reloadAccountInfo();
      })
      .catch(err => {
        if (err instanceof ValidationError) {
          toast.error(t('changeEmailPage.fail'));
        } else if (err instanceof RateLimitingError) {
          toast.error(t('changeEmailPage.rateLimitingError'));
        } else {
          toast.error(t('changeEmailPage.serverError'));
        }

        history.push("/");
      });
  });

  useReloadedAccountInfo((_) => {
    history.push("/");
  });

  useMissingAccountInfo(() => {
    history.push("/");
  });

  return (<>
    <div className="d-flex justify-content-center m-4">
      <div className="text-center">
        <Spinner />
      </div>
    </div>
  </>);
};

export default ChangeEmailPage;
