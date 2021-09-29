import { FC, useEffect, useState, KeyboardEvent } from 'react';
import { Button, Form, FormGroup, Label, Input, Container, FormFeedback } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router';
import { toast } from 'react-toastify';

import { useAccountAPI } from './AccountAPI';
import { useSession } from '../session/SessionProvider';
import OAuth2Buttons from '../login/oauth2/OAuth2Buttons';
import CaptchaWidget from '../captcha/CaptchaWidget';
import { ValidationError, RateLimitingError } from '../common/API';
import type { CaptchaAnswer } from '../captcha/CaptchaAPI';

const RegisterPage: FC = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const { session } = useSession();
    const { registerNewAccount } = useAccountAPI();

    const [username, setUsername] = useState<string>(() => "");
    const [email, setEmail] = useState<string>(() => "");
    const [password1, setPassword1] = useState<string>(() => "");
    const [password2, setPassword2] = useState<string>(() => "");
    const [usernameError, setUsernameError] = useState<string>(() => "");
    const [emailError, setEmailError] = useState<string>(() => "");
    const [passwordError, setPasswordError] = useState<string>(() => "");
    const [captcha, setCaptcha] = useState<CaptchaAnswer | null>(() => null);
    const [captchaError, setCaptchaError] = useState<string>(() => "");
    const [isLoading, setIsLoading] = useState<boolean>(() => false);

    const handleRegister = () => {
        if (!captcha) {
            return;
        }

        setIsLoading(true);
        
        registerNewAccount(username, email, password1, captcha)
            .then(() => {
                history.push('/registration/successful');
            })
            .catch(err => {
                if (err instanceof RateLimitingError) {
                    toast.error(t('registerPage.rateLimitingError'));
                } else if (err instanceof ValidationError) {
                    err.causes.forEach(cause => {
                        let field = cause.field;
                        let code = cause.code;

                        if (field === "username") {
                            if (code === "required" || code === "gt") {
                                setUsernameError(t('registerPage.userNameRequiredError'));
                            } else if (code === "accountname") {
                                setUsernameError(t('registerPage.userNameFormatError'));
                            } else if (code === "unique") {
                                setUsernameError(t('registerPage.userNameExistsError'));
                            }
                        } else if (field === "email") {
                            if (code === "required") {
                                setEmailError(t('registerPage.emailRequiredError'));
                            } else if (code === "email") {
                                setEmailError(t('registerPage.emailFormatError'));
                            } else if (code === "unique") {
                                setEmailError(t('registerPage.emailExistError'));
                            }
                        } else if (field === "password") {
                            if (code === "required" || code === "gt") {
                                setPasswordError(t('registerPage.passwordLengthError'));
                            }
                        } else if (field === "captcha" || field === "captcha.id" || field === "captcha.answer") {
                            setCaptchaError(t('registerPage.captchaError'));
                        }
                    });
                } else {
                    toast.error(t('registerPage.serverError'));
                }
            })
            .finally(() => {
                setIsLoading(false);  
            });
    };

    const handleFormKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (isLoading || !validateInputs()) {
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleRegister();
        }
    };

    const validateInputs = () => {
        return username && email && password1 && password2 && (password1 === password2) && (captcha && captcha.answer);
    };

    const checkBothPasswordsEqual = () => {
        if (password1 !== password2) {
            setPasswordError(t('registerPage.passwordsNotEqualError'));
        }
    };

    useEffect(() => {
        if (session.isActive) {
            history.push('/');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    return (
        <div className="d-flex justify-content-center mt-3">
            <Container>
                <Form>
                    <FormGroup>
                        <Label for="username">{t('registerPage.username')}</Label>
                        <Input type="text" name="username" id="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            onFocus={() => setUsernameError("")}
                            invalid={usernameError !== ""}
                            onKeyDown={e => handleFormKeyPress(e)}
                        />
                        <FormFeedback valid={usernameError === ""}>{usernameError}</FormFeedback>
                    </FormGroup>
                    <FormGroup>
                        <Label for="email">{t('registerPage.email')}</Label>
                        <Input type="email" name="email" id="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onFocus={() => setEmailError("")}
                            invalid={emailError !== ""}
                            onKeyDown={e => handleFormKeyPress(e)}
                        />
                        <FormFeedback valid={emailError === ""}>{emailError}</FormFeedback>
                    </FormGroup>
                    <FormGroup>
                        <Label for="password">{t('registerPage.password')}</Label>
                        <Input type="password" name="password" id="password"
                            value={password1}
                            onChange={e => setPassword1(e.target.value)}
                            onFocus={() => setPasswordError("")}
                            invalid={passwordError !== ""}
                            onKeyDown={e => handleFormKeyPress(e)}
                        />
                        <FormFeedback valid={passwordError === ""}>{passwordError}</FormFeedback>
                    </FormGroup>
                    <FormGroup>
                        <Label for="repeatPassword">{t('registerPage.repeatPassword')}</Label>
                        <Input type="password" name="repeatPassword" id="repeatPassword"
                            value={password2}
                            onChange={e => setPassword2(e.target.value)}
                            onFocus={() => setPasswordError("")}
                            invalid={passwordError !== ""}
                            onBlur={checkBothPasswordsEqual}
                            onKeyDown={e => handleFormKeyPress(e)}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label for="captcha">{t('registerPage.captcha')}</Label>
                        <CaptchaWidget 
                            onChange={(c) => setCaptcha(c)}
                            error={captchaError}
                            setError={setCaptchaError}
                            inputProps={{
                                onKeyDown: e => handleFormKeyPress(e)
                            }}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Button color="primary" onClick={handleRegister} disabled={isLoading || !validateInputs()}>{t('registerPage.registerButton')}</Button>
                    </FormGroup>

                    <hr />

                    <OAuth2Buttons />
                </Form>
            </Container>
        </div>
    );
};

export default RegisterPage;
