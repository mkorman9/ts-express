import { FC } from 'react';
import { useHistory } from 'react-router';
import { Button, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { AiOutlineUser } from 'react-icons/ai';

import { useSession } from '../session/SessionProvider';
import { useAccountInfo } from '../accounts/AccountInfo';

const LogInWidget: FC = () => {
    const { t } = useTranslation();
    const { session, endSession } = useSession();
    const { accountInfo } = useAccountInfo();
    const history = useHistory();

    const handleLogout = () => {
        endSession()
            .then(() => {
                history.push('/login');
            })
            .catch(err => {
                console.log(`error logging out: ${err}`);
            });
    };

    if (!session.isActive) {
        return (<>
            <UncontrolledDropdown className="mt-auto mb-auto">
                <DropdownToggle nav>
                    <Button className="mr-2 btn-light">
                        <span className="mr-2">{t('navigation.loggedOutButton')}</span>
                        <AiOutlineUser size="30" />
                    </Button>
                </DropdownToggle>
                <DropdownMenu right>
                    <DropdownItem onClick={() => history.push("/login")}>
                        {t('navigation.logIn')}
                    </DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem onClick={() => history.push("/register")}>
                        {t('navigation.createAccount')}
                    </DropdownItem>
                </DropdownMenu>
            </UncontrolledDropdown>
        </>);
    } else {
        return (<>
            <div className="mt-auto mb-auto">
                <UncontrolledDropdown className="d-inline-block">
                    <DropdownToggle nav>
                        <Button className="mt-auto mb-auto btn-light">
                            <span className="mr-2">{accountInfo.isLoadedValidInfo && t('navigation.hello', { name: accountInfo.data.username })}</span>
                            <AiOutlineUser size="30" />
                        </Button>
                    </DropdownToggle>
                    <DropdownMenu right>
                        <DropdownItem onClick={() => history.push("/profile")}>
                            {t('navigation.profile')}
                        </DropdownItem>
                        <DropdownItem divider />
                        <DropdownItem onClick={handleLogout}>
                            {t('navigation.logOut')}
                        </DropdownItem>
                    </DropdownMenu>
                </UncontrolledDropdown>
            </div>
        </>);
    }
};

export default LogInWidget;
