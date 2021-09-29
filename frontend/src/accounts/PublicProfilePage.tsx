import { FC, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { Badge, Form, FormGroup, Label, Input, Container, Spinner } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import moment, { Moment } from 'moment';

import { ValidationError } from '../common/API';
import { useAccountAPI } from './AccountAPI';
import { useLanguages } from '../common/LanguagesProvider';
import { useSession } from '../session/SessionProvider';
import RolesWidget from '../common/RolesWidget';
import AdminProfileWidget from '../admin/AdminProfileWidget';

export interface PublicProfilePageRouteProps {
  username?: string;
  id?: string;
}

const PublicProfilePage: FC<RouteComponentProps<PublicProfilePageRouteProps>> = (props) => {
  const targetUsername = props.match.params.username;
  const targetUserId = props.match.params.id;

  const { t } = useTranslation();
  const { getPublicAccountInfoByID, getPublicAccountInfoByUsername } = useAccountAPI();
  const { currentLanguage, getLanguageById } = useLanguages();
  const { session } = useSession();

  const [accountId, setAccountId] = useState<string>(() => "");
  const [username, setUsername] = useState<string>(() => "");
  const [language, setLanguage] = useState<string>(() => "en-US");
  const [registeredAt, setRegisteredAt] = useState<Moment>(() => moment.unix(0));
  const [roles, setRoles] = useState<Set<string>>(() => new Set());
  const [isBanned, setIsBanned] = useState<boolean>(() => false);
  const [bannedUntil, setBannedUntil] = useState<Moment>(() => moment.unix(0));
  const [isLoading, setIsLoading] = useState<boolean>(() => true);
  const [notFoundError, setNotFoundError] = useState<boolean>(() => false);

  useEffect(() => {
    let request = null;
    if (targetUserId) {
      request = getPublicAccountInfoByID(targetUserId);
    } else if (targetUsername) {
      request = getPublicAccountInfoByUsername(targetUsername);
    } else {
      return;
    }

    request
      .then(accountInfo => {
        setAccountId(accountInfo.id);
        setUsername(accountInfo.username);
        setLanguage(accountInfo.language);
        setRegisteredAt(accountInfo.registeredAt);
        setRoles(new Set(accountInfo.roles));
        setIsBanned(accountInfo.isBanned);
        setIsLoading(false);

        if (accountInfo.isBanned && accountInfo.bannedUntil) {
          setBannedUntil(accountInfo.bannedUntil);
        }
      })
      .catch(err => {
        if (err instanceof ValidationError) {
          setIsLoading(false);
          setNotFoundError(true);
        } else {
          toast.error(t('publicProfilePage.serverError'));
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userLanguage = getLanguageById(language);
  const userLanguageLabel = userLanguage ? userLanguage.label : "";

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center m-4">
        <div className="text-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (notFoundError) {
    return (
      <div className="d-flex justify-content-center m-4">
        <div className="text-center">
          <h2>{t('publicProfilePage.notFoundError')}</h2>
        </div>
      </div>
    );
  }

  return (<>
    <div className="d-flex justify-content-center m-4">
      <Container>
        <Form>
          {isBanned && (
            <FormGroup>
              <h3><Badge color="danger">{t('publicProfilePage.bannedMessage', { until: currentLanguage.formatDateTime(bannedUntil) })}</Badge></h3>
            </FormGroup>
          )}
          <FormGroup>
            <Label for="username">{t('publicProfilePage.username')}</Label>
            <Input type="text" name="username" id="username"
              value={username}
              disabled={true}
            />
          </FormGroup>
          <FormGroup>
            <Label for="language">{t('publicProfilePage.language')}</Label>
            <Input type="text" name="language" id="language"
              value={userLanguageLabel}
              disabled={true}
            />
          </FormGroup>
          <FormGroup>
            <Label for="registeredAt">{t('publicProfilePage.registeredAt')}</Label>
            <Input type="text" name="registeredAt" id="registeredAt"
              value={currentLanguage.formatDateTime(registeredAt)}
              disabled={true}
            />
          </FormGroup>
          <FormGroup>
            <Label for="roles">{t('publicProfilePage.roles')}</Label>
            <RolesWidget roles={roles} accountId={accountId} />
          </FormGroup>
        </Form>
        {session.data.roles.has('PERMISSIONS_ADMIN') && (
          <div className="mt-4">
            <hr />
            <AdminProfileWidget accountId={accountId} />
          </div>
        )}
      </Container>
    </div>
  </>);
};

export default PublicProfilePage;
