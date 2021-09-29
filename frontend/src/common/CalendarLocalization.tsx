import { FC, useEffect, useState, PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import MomentLocalizer from 'react-widgets-moment';
import { Localization } from 'react-widgets';

import { useLanguages } from './LanguagesProvider';

const CalendarLocalization: FC = (props: PropsWithChildren<{}>) => {
    const { t } = useTranslation();
    const { currentLanguage } = useLanguages();

    const [localizer, setLocalizer] = useState<any>(() => new (MomentLocalizer as any)(moment));

    useEffect(() => {
        setLocalizer(new (MomentLocalizer as any)(moment));
    }, [currentLanguage]);

    return (<>
        <Localization 
            date={localizer} 
            messages={{
                moveToday: t('dateSelector.today'),
                moveBack: t('dateSelector.back'),
                moveForward: t('dateSelector.forward'),
                dateButton: t('dateSelector.dateButton')
            }}
        >
            {props.children}
        </Localization>
    </>);
};

export default CalendarLocalization;
