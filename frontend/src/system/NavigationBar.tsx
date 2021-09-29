import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

import { useSession } from '../session/SessionProvider';
import LogInWidget from '../login/LogInWidget';
import { OnSmallScreen, OnRegularScreen } from '../common/ScreenSizeDependentContentProvider';
import LanguageSelectionWidget from './LanguageSelectionWidget';

const NavigationBar: FC = () => {
    const { t } = useTranslation();
    const { session } = useSession();

    return (
        <Navbar color="light" light expand="md">
            <NavbarBrand to="/" tag={Link}>
                <OnRegularScreen>{'ts-express'}</OnRegularScreen>
                <OnSmallScreen>{'>'}</OnSmallScreen>
            </NavbarBrand>
            <Nav className="mr-auto" navbar>
                <OnRegularScreen>
                    <NavItem>
                        <NavLink to="/" tag={Link}>{t('navigation.clientsList')}</NavLink>
                    </NavItem>
                    {session.data.roles.has('PERMISSIONS_ADMIN') && (
                        <NavItem>
                            <NavLink to="/admin/accounts" tag={Link}>{t('navigation.accountsList')}</NavLink>
                        </NavItem>
                    )}
                </OnRegularScreen>
                <OnSmallScreen>
                    <UncontrolledDropdown className="mt-auto mb-auto">
                        <DropdownToggle nav caret>
                            <span>{t('navigation.menu')}</span>
                        </DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem>
                                <NavLink to="/" tag={Link}>{t('navigation.clientsList')}</NavLink>
                            </DropdownItem>
                            {session.data.roles.has('PERMISSIONS_ADMIN') && (
                                <DropdownItem>
                                    <NavLink to="/admin/accounts" tag={Link}>{t('navigation.accountsList')}</NavLink>
                                </DropdownItem>
                            )}
                        </DropdownMenu>
                    </UncontrolledDropdown>
                </OnSmallScreen>
            </Nav>
            <Nav className="ml-auto" navbar>
                <div className="d-inline-flex flew-row">
                    <NavItem>
                        <LogInWidget />
                    </NavItem>
                    <NavItem>
                        <LanguageSelectionWidget />
                    </NavItem>
                </div>
            </Nav>
        </Navbar>
    );
};

export default NavigationBar;
