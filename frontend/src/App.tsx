import { FC, PropsWithChildren } from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { Trans } from 'react-i18next';
import { ToastContainer } from 'react-toastify';

import './i18n';
import NavigationBar from './system/NavigationBar';
import NotFoundPage from './system/NotFoundPage';
import LanguagesProvider from './common/LanguagesProvider';
import CalendarLocalization from './common/CalendarLocalization';
import ScreenSizeDependentContentProvider from './common/ScreenSizeDependentContentProvider';

import ClientsTablePage from './clients/ClientsTablePage';

import SessionProvider from './session/SessionProvider';
import AccountInfoProvider from './accounts/AccountInfo';
import SessionOverlay from './session/SessionOverlay';
import AccountInfoOverlay from './accounts/AccountInfoOverlay';
import LoginPage from './login/LoginPage';
import RegisterPage from './accounts/RegisterPage';
import RegistrationSuccessfulPage from './accounts/RegistrationSuccessfulPage';
import ActivateAccountPage from './accounts/ActivateAccountPage';
import ChangeEmailPage from './accounts/ChangeEmailPage';
import ProfilePage from './accounts/ProfilePage';
import PublicProfilePage from './accounts/PublicProfilePage';
import GithubCallback from './login/oauth2/GithubCallback';
import ForgotPasswordPage from './accounts/ForgotPasswordPage';
import SetPasswordPage from './accounts/SetPasswordPage';

import AccountsListPage from './accounts/AccountsListPage';

import { SessionAPIProvider } from './session/SessionAPI';
import { ClientsAPIProvider } from './clients/ClientsAPI';
import { LoginAPIProvider } from './login/LoginAPI';
import { AccountAPIProvider } from './accounts/AccountAPI';
import { OAuth2APIProvider } from './login/oauth2/OAuth2API';
import { CaptchaAPIProvider } from './captcha/CaptchaAPI';
import { AdminAPIProvider } from './admin/AdminAPI';

import './App.scss';

const AppProviders: FC = (props: PropsWithChildren<unknown>) => {
  const components = [
    Trans,
    ScreenSizeDependentContentProvider,
    LanguagesProvider,
    CalendarLocalization,
    SessionAPIProvider,
    SessionProvider,

    ClientsAPIProvider,
    LoginAPIProvider,
    AccountAPIProvider,
    OAuth2APIProvider,
    CaptchaAPIProvider,
    AdminAPIProvider,

    AccountInfoProvider,

    SessionOverlay,
    AccountInfoOverlay
  ];
  const children = props.children;

  return (<>
    {components.reduceRight((acc, Component) => {
      return <Component>{acc}</Component>
    }, children)}
  </>);
};

const App: FC = () => {
  return (<>
    <AppProviders>
      <BrowserRouter>
        <ToastContainer position="top-center" autoClose={false} />
        <NavigationBar />

        <Switch>
          <Route exact path="/" component={ClientsTablePage} />

          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/register" component={RegisterPage} />
          <Route exact path="/registration/successful" component={RegistrationSuccessfulPage} />
          <Route exact path="/account/activate/:accountId" component={ActivateAccountPage} />
          <Route exact path="/email/change/:accountId/:code" component={ChangeEmailPage} />
          <Route exact path="/profile" component={ProfilePage} />
          <Route exact path="/profile/user/:username" component={PublicProfilePage} />
          <Route exact path="/profile/id/:id" component={PublicProfilePage} />
          <Route exact path="/password/forgot" component={ForgotPasswordPage} />
          <Route exact path="/password/set" component={SetPasswordPage} />
          <Route exact path="/password/set/:accountId/:code" component={SetPasswordPage} />

          <Route path="/oauth2/github/callback" component={GithubCallback} />

          <Route path="/admin/accounts" component={AccountsListPage} />

          <Route path='/not-found' component={NotFoundPage} />
          <Redirect from='*' to='/not-found' />
        </Switch>

        <div className="mb-4"></div>
      </BrowserRouter>
    </AppProviders>
  </>);
};

export default App;
