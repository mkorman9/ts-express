import { FC } from 'react';
import { useTranslation } from 'react-i18next';

const NotFoundPage: FC = () => {
    const { t } = useTranslation();

    return (<>
        <div className="d-flex justify-content-center m-4">
            <div className="text-center">
                <h2>{t('notFound.header')}</h2>
                <span>{t('notFound.message')}</span>
            </div>
        </div>
    </>);
};

export default NotFoundPage;
