import { FC, useState, KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Form, FormGroup, Label, Input, Container } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router';
import { toast } from 'react-toastify';

import { useLoginAPI } from './LoginAPI';
import { SessionData } from '../session/SessionAPI';
import { useSession } from '../session/SessionProvider';
import OAuth2Buttons from './oauth2/OAuth2Buttons';
import { UnauthorizedError, RateLimitingError } from '../common/API';

const LoginPage: FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { useActiveSession, newSession } = useSession();
  const { authWithPassword } = useLoginAPI();

  const [email, setEmail] = useState<string>(() => "");
  const [password, setPassword] = useState<string>(() => "");
  const [rememberMe, setRememberMe] = useState<boolean>(() => false);
  const [error, setError] = useState<string>(() => "");
  const [isLoading, setIsLoading] = useState<boolean>(() => false);

  const successfulLogin = (sessionData: SessionData) => {
    setEmail("");
    setPassword("");
    setError("");
    setRememberMe(false);
    setIsLoading(false);
    newSession(sessionData);
    history.push('/');
  };

  const handleLogin = () => {
    setIsLoading(true);

    authWithPassword(email, password, rememberMe)
      .then(sessionData => {
        successfulLogin(sessionData);
      })
      .catch(err => {
        setIsLoading(false);
        setPassword("");
                
        if (err instanceof UnauthorizedError) {
          err.causes.forEach(cause => {
            const field = cause.field;
            const code = cause.code;

            if (field === "credentials") {
              if (code === "invalid") {
                setError(t('loginPage.invalidCredentialsError'));
                return;
              }
            } else if (field === "account") {
              if (code === "inactive") {
                setError(t('loginPage.inactiveAccountError'));
                return;
              }
            }
          });
        } else if (err instanceof RateLimitingError) {
          setError(t('loginPage.rateLimitingError'));
        } else {
          toast.error(t('loginPage.serverError'));
        }
      });
  };

  const handleFormKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isLoading || !validateInputs()) {
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleLogin();
    }
  };

  const validateInputs = () => {
    return email && password;
  };

  useActiveSession((_) => {
    history.push('/');
  });

  return (
    <div className="d-flex justify-content-center mt-3">
      <Container>
        <Form>
          <FormGroup>
            <Label for="email">{t('loginPage.email')}</Label>
            <Input type="email" name="email" id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setError("")}
              onKeyDown={e => handleFormKeyPress(e)}
            />
          </FormGroup>
          <FormGroup>
            <Label for="password">{t('loginPage.password')}</Label>
            <Input type="password" name="password" id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setError("")}
              onKeyDown={e => handleFormKeyPress(e)}
            />
          </FormGroup>
          <div className="float-left">
            <FormGroup check>
              <Label check>
                <Input type="checkbox" name="rememberMe" id="rememberMe" 
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                {' '}{t('loginPage.rememberMe')}
              </Label>
            </FormGroup>
          </div>
          <div className="float-right">
            <FormGroup className="text-right">
              <small><Link to="/password/forgot">{t('loginPage.forgotPasswordButton')}</Link></small>
            </FormGroup>
          </div>
          <div className="clearfix"></div>

          {error !== "" && (
            <FormGroup>
              <Alert color="danger">
                {error}
              </Alert>
            </FormGroup>
          )
          }
          <FormGroup>
            <Button color="primary" onClick={handleLogin} disabled={isLoading || !validateInputs()}>{t('loginPage.logInButton')}</Button>
          </FormGroup>

          <hr />

          <OAuth2Buttons />
        </Form>
      </Container>
    </div>
  );
};

export default LoginPage;
