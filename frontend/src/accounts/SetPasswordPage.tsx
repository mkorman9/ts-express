import { FC, useState } from 'react';
import { Button, Form, FormGroup, Label, Input, Container, FormFeedback } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { useHistory, RouteComponentProps } from 'react-router';
import { toast } from 'react-toastify';

import { useAccountAPI } from './AccountAPI';
import { useAccountInfo } from './AccountInfo';
import { UnauthorizedError, ValidationError, RateLimitingError } from '../common/API';

export interface SetPasswordPageRouteProps {
    accountId: string;
    code: string;
}

const SetPasswordPage: FC<RouteComponentProps<SetPasswordPageRouteProps>> = (props) => {
    const accountId = props.match.params.accountId;
    const code = props.match.params.code;

    const { t } = useTranslation();
    const history = useHistory();
    const { accountInfo, reloadAccountInfo } = useAccountInfo();
    const { setNewPassword } = useAccountAPI();

    const [password1, setPassword1] = useState<string>(() => "");
    const [password2, setPassword2] = useState<string>(() => "");
    const [passwordError, setPasswordError] = useState<string>(() => "");
    const [isLoading, setIsLoading] = useState<boolean>(() => false);

    const validateForm = () => {
        return password1 && password2 && (password1 === password2);
    };

    const checkBothNewPasswordsEqual = () => {
        if (password1 !== password2) {
            setPasswordError(t('setPasswordPage.passwordsNotEqualError'));
        }
    };

    const handleSet = () => {
        setIsLoading(true);

        setNewPassword(password1, accountId, code)
            .then(() => {
                setPassword1("");
                setPassword2("");
                toast.success(t('setPasswordPage.success'));

                if (accountInfo.isLoadedValidInfo) {
                    reloadAccountInfo();
                }

                history.push('/');
            })
            .catch(err => {
                if (err instanceof RateLimitingError) {
                    toast.error(t('setPasswordPage.rateLimitingError'));
                } else if (err instanceof UnauthorizedError) {
                    history.push('/');
                } else if (err instanceof ValidationError) {
                    err.causes.forEach(cause => {
                        let field = cause.field;
                        let code = cause.code;

                        if (field === "password") {
                            if (code === "required" || code === "gt") {
                                setPasswordError(t('setPasswordPage.passwordLengthError'));
                                return;
                            }
                        } else if (field === "email") {
                            if (code === "unique") {
                                toast.error(t('setPasswordPage.emailExistError'));
                                return;
                            }
                        } else if (field === "account") {
                            toast.error(t('setPasswordPage.invalidAccountError'));
                            return;
                        } else if (field === "accountID" || field === "code") {
                            toast.error(t('setPasswordPage.invalidAccountError'));
                            return;
                        }
                    });
                } else {
                    toast.error(t('setPasswordPage.serverError'));
                }
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (<>
        <div className="d-flex justify-content-center m-4">
            <Container>
                <Form>
                    {(accountInfo.isLoadedValidInfo && !accountInfo.data.loginMethods.emailAndPassword.defined) && (<>
                        <FormGroup>
                            <Label for="email">{t('setPasswordPage.email')}</Label>
                            <Input type="email" name="email" id="email"
                                value={accountInfo.data.email}
                                disabled={true}
                            />
                        </FormGroup>
                    </>)}
                    <FormGroup>
                        <Label for="password">{t('setPasswordPage.password')}</Label>
                        <Input type="password" name="password" id="password"
                            value={password1}
                            onChange={e => setPassword1(e.target.value)}
                            onFocus={() => setPasswordError("")}
                            invalid={passwordError !== ""}
                        />
                        <FormFeedback valid={passwordError === ""}>{passwordError}</FormFeedback>
                    </FormGroup>
                    <FormGroup>
                        <Label for="repeatPassword">{t('setPasswordPage.repeatPassword')}</Label>
                        <Input type="password" name="repeatPassword" id="repeatPassword"
                            value={password2}
                            onChange={e => setPassword2(e.target.value)}
                            onFocus={() => setPasswordError("")}
                            onBlur={checkBothNewPasswordsEqual}
                            invalid={passwordError !== ""}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Button color="primary" onClick={handleSet} disabled={isLoading || !validateForm()}>
                            {t('setPasswordPage.setPasswordButtonText')}
                        </Button>
                    </FormGroup>
                </Form>
            </Container>
        </div>
    </>);
};

export default SetPasswordPage;
