import { FC } from 'react';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

import { useLanguages } from '../common/LanguagesProvider';
import type { LanguageDefinition } from '../common/LanguagesProvider';

const LanguageSelectionWidget: FC = () => {
    const { allLanguages, currentLanguage, changeLanguage } = useLanguages();

    const handleLanguageChange = (language: LanguageDefinition) => {
        changeLanguage(language.id)
            .catch(_ => {
            });
    };

    return (<>
        <UncontrolledDropdown className="mt-auto mb-auto pt-2">
            <DropdownToggle nav caret>
                <img src={currentLanguage.icon} alt={''} className="mb-1" />
            </DropdownToggle>
            <DropdownMenu right>
                {allLanguages.map(l => 
                    <DropdownItem key={l.id} onClick={() => handleLanguageChange(l)}>
                        {((l.id === currentLanguage.id) ? '✓ ' : '  ')} <img src={l.icon} alt={''} className="mb-1 ml-1" /> {l.label}
                    </DropdownItem>
                )}
            </DropdownMenu>
        </UncontrolledDropdown>
    </>);
};

export default LanguageSelectionWidget;
