import { FC, useState } from 'react';
import { Badge, Button, Form, FormGroup, Label, Input, Container, FormFeedback, Spinner } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router';
import { toast } from 'react-toastify';
import moment, { Moment } from 'moment';

import { useAccountInfo } from './AccountInfo';
import { useAccountAPI, AccountInfo, EditProfilePayload } from './AccountAPI';
import { useLanguages } from '../common/LanguagesProvider';
import OAuth2Buttons from '../login/oauth2/OAuth2Buttons';
import { UnauthorizedError, ValidationError } from '../common/API';
import RolesWidget from '../common/RolesWidget';

const ProfilePage: FC = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const { useLoadedAccountInfo, useMissingAccountInfo, reloadAccountInfo } = useAccountInfo();
    const { editProfile } = useAccountAPI();
    const { allLanguages, currentLanguage } = useLanguages();

    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(() => null);
    const [accountId, setAccountId] = useState<string>(() => "");
    const [username, setUsername] = useState<string>(() => "");
    const [email, setEmail] = useState<string>(() => "");
    const [language, setLanguage] = useState<string>(() => "en-US");
    const [registeredAt, setRegisteredAt] = useState<Moment>(() => moment.unix(0));
    const [roles, setRoles] = useState<Set<string>>(() => new Set());
    const [isBanned, setIsBanned] = useState<boolean>(() => false);
    const [bannedUntil, setBannedUntil] = useState<Moment>(() => moment.unix(0));
    const [oldPassword, setOldPassword] = useState<string>(() => "");
    const [newPassword1, setNewPassword1] = useState<string>(() => "");
    const [newPassword2, setNewPassword2] = useState<string>(() => "");
    const [usernameError, setUsernameError] = useState<string>(() => "");
    const [emailError, setEmailError] = useState<string>(() => "");
    const [oldPasswordError, setOldPasswordError] = useState<string>(() => "");
    const [newPasswordError, setNewPasswordError] = useState<string>(() => "");
    const [usernameChanged, setUsernameChanged] = useState<string>(() => "");
    const [emailChanged, setEmailChanged] = useState<string>(() => "");
    const [passwordChanged, setPasswordChanged] = useState<string>(() => "");
    const [isLoading, setIsLoading] = useState<boolean>(() => false);

    useLoadedAccountInfo((newAccountInfo) => {
        setAccountInfo(newAccountInfo.data);
        setAccountId(newAccountInfo.data.id);
        if (!usernameError) {
            setUsername(newAccountInfo.data.username);
        }
        if (!emailError) {
            setEmail(newAccountInfo.data.email);
        }
        setLanguage(newAccountInfo.data.language);
        setRegisteredAt(newAccountInfo.data.registeredAt);
        setRoles(new Set(newAccountInfo.data.roles));
        setIsBanned(newAccountInfo.data.isBanned);

        if (newAccountInfo.data.isBanned && newAccountInfo.data.bannedUntil) {
            setBannedUntil(newAccountInfo.data.bannedUntil);
        }
    });

    useMissingAccountInfo(() => {
        setAccountInfo(null);
        history.push('/login');
    });

    const hasPasswordCredentials = () => {
        return accountInfo && accountInfo.loginMethods.emailAndPassword.defined;
    };

    const hasGithubCredentials = () => {
        return accountInfo && accountInfo.loginMethods.github.defined;
    };

    const isMissingAnyCredentials = () => {
        if (!accountInfo) {
            return false;
        }

        return !accountInfo.loginMethods.emailAndPassword.defined || !accountInfo.loginMethods.github.defined;
    };

    const isMissingAnyOAuth2Credentials = () => {
        if (!accountInfo) {
            return false;
        }
        
        return !accountInfo.loginMethods.github.defined;
    };

    const validateForm = () => {
        if (!username) {
            return false;
        }

        if (!email) {
            return false;
        }

        if (oldPassword || newPassword1 || newPassword2) {
            return (oldPassword && newPassword1 && newPassword2) && (newPassword1 === newPassword2);
        }

        return true;
    };

    const anyChanges = () => {
        if (!accountInfo) {
            return false;
        }

        if (username !== accountInfo.username) {
            return true;
        }

        if (email !== accountInfo.email) {
            return true;
        }

        if (language !== accountInfo.language) {
            return true;
        }

        if (oldPassword || newPassword1 || newPassword2) {
            return true;
        }

        return false;
    };

    const checkBothNewPasswordsEqual = () => {
        if (newPassword1 !== newPassword2) {
            setNewPasswordError(t('editProfilePage.passwordsNotEqualError'));
        }
    };

    const handleSave = () => {
        if (!validateForm() || !accountInfo) {
            return;
        }

        setUsernameChanged("");
        setEmailChanged("");
        setPasswordChanged("");

        let payload: EditProfilePayload = {};

        if (username !== accountInfo.username) {
            payload.username = username;
        }
        if (email !== accountInfo.email) {
            payload.email = email;
        }
        if (language !== accountInfo.language) {
            payload.language = language;
        }
        if (newPassword1) {
            payload.password = {
                oldPassword: oldPassword,
                newPassword: newPassword1
            };
        }

        if (Object.keys(payload).length === 0) {
            return;
        }

        setIsLoading(true);

        editProfile(payload)
            .then(response => {
                if (response.username.isModified) {
                    setUsernameChanged(t('editProfilePage.successUsernameChanged'));
                } else {
                    if (response.username.isServerError) {
                        setUsernameError(t('editProfilePage.serverError'));
                    } else if (response.username.causes !== undefined) {
                        response.username.causes.forEach(cause => {
                            let field = cause.field;
                            let code = cause.code;

                            if (field === "username.username") {
                                if (code === "unique") {
                                    setUsernameError(t('editProfilePage.userNameExistsError'));
                                }
                            } else if (field === "account") {
                                setUsernameError(t('editProfilePage.invalidAccountError'));
                            }
                        });
                    }
                }

                if (response.language.isModified) {
                    toast.success(t('editProfilePage.successLanguageChanged'), { autoClose: 2000, closeOnClick: true });
                }

                if (response.email.isModified) {
                    setEmailChanged(t('editProfilePage.successEmailChanged', { email: email }));
                } else {
                    if (response.email.isServerError) {
                        setEmailError(t('editProfilePage.serverError'));
                    } else if (response.email.causes !== undefined) {
                        response.email.causes.forEach(cause => {
                            let field = cause.field;
                            let code = cause.code;

                            if (field === "email.email") { 
                                if (code === "unique") {
                                    setEmailError(t('editProfilePage.emailExistError'));
                                }
                            } else if (field === "account") {
                                setEmailError(t('editProfilePage.invalidAccountError'));
                            }
                        });
                    }
                }

                if (response.password.isModified) {
                    setPasswordChanged(t('editProfilePage.successPasswordChanged'));
                    setOldPassword("");
                    setNewPassword1("");
                    setNewPassword2("");
                } else {
                    if (response.password.isServerError) {
                        setOldPasswordError(t('editProfilePage.serverError'));
                    } else if (response.password.causes !== undefined) {
                        response.password.causes.forEach(cause => {
                            let field = cause.field;
                            let code = cause.code;

                            if (field === "password.oldPassword") {
                                if (code === "invalid") {
                                    setOldPasswordError(t('editProfilePage.oldPasswordInvalidError'));
                                    setOldPassword("");
                                }
                            } else if (field === "account") {
                                setOldPasswordError(t('editProfilePage.invalidAccountError'));
                            }
                        });
                    }
                }

                if (response.username.isModified || response.language.isModified || response.email.isModified || response.password.isModified) {
                    reloadAccountInfo();
                }
            })
            .catch(err => {
                if (err instanceof UnauthorizedError) {
                    history.push('/login');
                } else if (err instanceof ValidationError) {
                    err.causes.forEach(cause => {
                        let field = cause.field;
                        let code = cause.code;

                        if (field === "username.username") {
                            if (code === "required" || code === "gt") {
                                setUsernameError(t('editProfilePage.userNameLengthError'));
                            }
                        } else if (field === "email.email") { 
                            if (code === "required") {
                                setEmailError(t('editProfilePage.emailRequiredError'));
                            } else if (code === "email") {
                                setEmailError(t('editProfilePage.emailFormatError'));
                            }
                        } else if (field === "password.oldPassword") {
                            if (code === "required") {
                                setOldPasswordError(t('editProfilePage.oldPasswordRequiredError'));
                            }
                        } else if (field === "password.newPassword") {
                            if (code === "required" || code === "gt") {
                                setNewPasswordError(t('editProfilePage.newPasswordLengthError'));
                                setNewPassword1("");
                                setNewPassword2("");
                            }
                        }
                    });
                } else {
                    toast.error(t('editProfilePage.serverError'));
                }
            })
            .finally(() => {
                setIsLoading(false);  
            });
    };

    if (!accountInfo) {
        return (<>
            <div className="d-flex justify-content-center m-4">
                <Spinner />
            </div>
        </>);
    }

    return (<>
        <div className="d-flex justify-content-center m-4">
            <Container>
                <Form>
                    {isBanned && (
                        <FormGroup>
                            <h3><Badge color="danger">{t('editProfilePage.bannedMessage', { until: currentLanguage.formatDateTime(bannedUntil) })}</Badge></h3>
                        </FormGroup>
                    )}
                    <FormGroup>
                        <Label for="username">{t('editProfilePage.username')}</Label>
                        <Input type="text" name="username" id="username"
                            value={username}
                            onFocus={() => { setUsernameError(""); setUsernameChanged(""); }}
                            invalid={usernameError !== ""}
                            valid={usernameChanged !== ""}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <FormFeedback valid={usernameError === ""}>{usernameError}{usernameChanged}</FormFeedback>
                    </FormGroup>
                    <FormGroup>
                        <Label for="email">{t('editProfilePage.email')}</Label>
                        <Input type="email" name="email" id="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onFocus={() => { setEmailError(""); setEmailChanged(""); }}
                            invalid={emailError !== ""}
                            valid={emailChanged !== ""}
                            disabled={!hasPasswordCredentials()}
                        />
                        <FormFeedback valid={emailError === ""}>{emailError}{emailChanged}</FormFeedback>
                    </FormGroup>
                    <FormGroup>
                        <Label for="language">{t('editProfilePage.language')}</Label>
                        <Input type="select" name="language" id="language"
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                        >
                            {allLanguages.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                        </Input>
                    </FormGroup>
                    <FormGroup>
                        <Label for="registeredAt">{t('editProfilePage.registeredAt')}</Label>
                        <Input type="text" name="registeredAt" id="registeredAt"
                            value={currentLanguage.formatDateTime(registeredAt)}
                            disabled={true}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label for="roles">{t('editProfilePage.roles')}</Label>
                        <RolesWidget roles={roles} accountId={accountId} />
                    </FormGroup>

                    {hasPasswordCredentials() && (<>
                        <hr className="mb-4 mt-4" />

                        <FormGroup>
                            <Label for="oldPassword">{t('editProfilePage.oldPassword')}</Label>
                            <Input type="password" name="oldPassword" id="oldPassword"
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                onFocus={() => { setOldPasswordError(""); setPasswordChanged(""); }}
                                invalid={oldPasswordError !== ""}
                                valid={passwordChanged !== ""}
                            />
                            <FormFeedback valid={oldPasswordError === ""}>{oldPasswordError}{passwordChanged}</FormFeedback>
                        </FormGroup>
                        <FormGroup>
                            <Label for="newPassword1">{t('editProfilePage.newPassword')}</Label>
                            <Input type="password" name="newPassword1" id="newPassword1"
                                value={newPassword1}
                                onChange={e => setNewPassword1(e.target.value)}
                                onFocus={() => setNewPasswordError("")}
                                invalid={newPasswordError !== ""}
                            />
                            <FormFeedback valid={newPasswordError === ""}>{newPasswordError}</FormFeedback>
                        </FormGroup>
                        <FormGroup>
                            <Label for="newPassword2">{t('editProfilePage.repeatNewPassword')}</Label>
                            <Input type="password" name="newPassword2" id="newPassword2"
                                value={newPassword2}
                                onChange={e => setNewPassword2(e.target.value)}
                                onFocus={() => setNewPasswordError("")}
                                onBlur={checkBothNewPasswordsEqual}
                                invalid={newPasswordError !== ""}
                            />
                        </FormGroup> 
                    </>)}
                    
                    {isMissingAnyCredentials() && (<>
                        <hr className="mb-4 mt-4" />

                        {!hasPasswordCredentials() && (<>
                            <div className="text-center">
                                <Button color="primary" onClick={() => history.push('/password/set')}>
                                    {t('editProfilePage.setPasswordButtonText')}
                                </Button>
                            </div>
                        </>)}

                        {isMissingAnyOAuth2Credentials() && (<>
                            <OAuth2Buttons 
                                showGithub={!hasGithubCredentials()} 
                            />
                        </>)}
                        
                    </>)}

                    <hr className="mb-4 mt-4" />

                    <FormGroup>
                        <Button color="primary" onClick={handleSave} disabled={isLoading || !validateForm() || !anyChanges()}>
                            {t('editProfilePage.saveButtonText')}
                        </Button>
                    </FormGroup>
                </Form>
            </Container>
        </div>
    </>);
};

export default ProfilePage;
