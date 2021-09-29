import { FC, useEffect, useState } from 'react';
import { Button, Form, FormGroup, Label, Input, Container, FormFeedback } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router';
import { toast } from 'react-toastify';

import { useSession } from '../session/SessionProvider';
import { useAccountAPI } from './AccountAPI';
import CaptchaWidget from '../captcha/CaptchaWidget';
import { ValidationError, RateLimitingError } from '../common/API';
import { CaptchaAnswer } from '../captcha/CaptchaAPI';

const ForgotPasswordPage: FC = () => {
    const { t } = useTranslation();
    const history = useHistory();
    const { session } = useSession();
    const { requestPasswordReset } = useAccountAPI();

    const [email, setEmail] = useState<string>(() => "");
    const [emailError, setEmailError] = useState<string>(() => "");
    const [captcha, setCaptcha] = useState<CaptchaAnswer | null>(() => null);
    const [captchaError, setCaptchaError] = useState<string>(() => "");
    const [isLoading, setIsLoading] = useState<boolean>(() => false);

    const validateForm = () => {
        return email && (captcha && captcha.answer);
    };

    const handleReset = () => {
        setIsLoading(true);

        requestPasswordReset(email, captcha as CaptchaAnswer)
            .then(() => {
                setEmail("");
                toast.success(t('forgotPasswordPage.success'));
                history.push('/');
            })
            .catch(err => {
                if (err instanceof RateLimitingError) {
                    toast.error(t('forgotPasswordPage.rateLimitingError'));
                } else if (err instanceof ValidationError) {
                    err.causes.forEach(cause => {
                        let field = cause.field;
                        let code = cause.code;

                        if (field === "email") {
                            if (code === "required") {
                                setEmailError(t('forgotPasswordPage.emailRequiredError'));
                                return;
                            } else if (code === "email") {
                                setEmailError(t('forgotPasswordPage.emailFormatError'));
                                return;
                            }
                        } else if (field === "account") {
                            toast.error(t('forgotPasswordPage.invalidAccountError'));
                            return;
                        } else if (field === "captcha" || field === "captcha.id" || field === "captcha.answer") {
                            setCaptchaError(t('forgotPasswordPage.captchaError'));
                        }
                    });
                } else {
                    toast.error(t('forgotPasswordPage.serverError'));
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    useEffect(() => {
        if (session.isActive) {
            history.push('/');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    return (<>
        <div className="d-flex justify-content-center m-4">
            <Container>
                <Form>
                    <FormGroup>
                        <Label for="email">{t('forgotPasswordPage.email')}</Label>
                        <Input type="email" name="email" id="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onFocus={() => setEmailError("")}
                            invalid={emailError !== ""}
                        />
                        <FormFeedback valid={emailError === ""}>{emailError}</FormFeedback>
                    </FormGroup>
                    <FormGroup>
                        <Label for="captcha">{t('forgotPasswordPage.captcha')}</Label>
                        <CaptchaWidget 
                            onChange={(c) => setCaptcha(c)}
                            error={captchaError}
                            setError={setCaptchaError}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Button color="primary" onClick={handleReset} disabled={isLoading || !validateForm()}>
                            {t('forgotPasswordPage.resetPasswordButtonText')}
                        </Button>
                    </FormGroup>
                </Form>
            </Container>
        </div>
    </>);
};

export default ForgotPasswordPage;
