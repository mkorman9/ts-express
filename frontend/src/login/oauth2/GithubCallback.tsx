import { FC, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'reactstrap';
import { useHistory, RouteComponentProps } from 'react-router';
import { toast } from 'react-toastify';

import { parseQueryString } from '../../common/Utils';
import { useOAuth2API } from './OAuth2API';
import { useSession } from '../../session/SessionProvider';
import { ValidationError, RateLimitingError } from '../../common/API';

const GithubCallback: FC<RouteComponentProps> = (props) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { newSession } = useSession();
  const { performGithubCodeFlow } = useOAuth2API();

  useEffect(() => {
    const urlParams = parseQueryString(props.location.search);
    const code = urlParams.code;
    const state = urlParams.state;

    if (!code) {
      toast.error(t('githubOAuth2Callback.missingCodeError'), { autoClose: 5000, hideProgressBar: true, closeOnClick: true });
      history.push('/');
      return
    }
    if (!state) {
      toast.error(t('githubOAuth2Callback.missingStateError'), { autoClose: 5000, hideProgressBar: true, closeOnClick: true });
      history.push('/');
      return
    }

    performGithubCodeFlow(code, state)
      .then(sessionData => {
        newSession(sessionData);
      })
      .catch(err => {
        if (err instanceof ValidationError) {
          err.causes.forEach(cause => {
            const field = cause.field;
            const code = cause.code;

            if (field === "provider") {
              if (code === "disabled") {
                toast.error(t('githubOAuth2Callback.providerDisabledError'), { autoClose: 5000, hideProgressBar: true, closeOnClick: true });
                return;
              }
            } else if (field === "flow") {
              if (code === "failed") {
                toast.error(t('githubOAuth2Callback.flowFailedError'), { autoClose: 5000, hideProgressBar: true, closeOnClick: true });
                return;
              }
            } else if (field === "account") {
              if (code === "inactive") {
                toast.error(t('githubOAuth2Callback.inactiveAccountError'), { autoClose: 5000, hideProgressBar: true, closeOnClick: true });
                return;
              }
            } else if (field === "code") {
              toast.error(t('githubOAuth2Callback.missingCodeError'), { autoClose: 5000, hideProgressBar: true, closeOnClick: true });
              return;
            } else if (field === "state") {
              toast.error(t('githubOAuth2Callback.missingStateError'), { autoClose: 5000, hideProgressBar: true, closeOnClick: true });
              return;
            }
          });
        } else if (err instanceof RateLimitingError) {
          toast.error(t('githubOAuth2Callback.rateLimitingError'), { autoClose: 5000, hideProgressBar: true, closeOnClick: true });
        } else {
          toast.error(t('githubOAuth2Callback.serverError'), { autoClose: 5000, hideProgressBar: true, closeOnClick: true });
        }
      })
      .finally(() => {
        history.push('/');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (<>
    <div className="d-flex justify-content-center m-4">
      <div className="text-center">
        <Spinner />
      </div>
    </div>
  </>);
};

export default GithubCallback;
