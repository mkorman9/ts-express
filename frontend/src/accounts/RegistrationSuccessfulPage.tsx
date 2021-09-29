import { FC } from 'react';
import { useTranslation } from 'react-i18next';

const RegistrationSuccessfulPage: FC = () => {
  const { t } = useTranslation();

  return (<>
    <div className="d-flex justify-content-center m-4">
      <div className="text-center">
        <h2>{t('registationSuccessfulPage.header')}</h2>
        <span>{t('registationSuccessfulPage.message')}</span>
      </div>
    </div>
  </>);
};

export default RegistrationSuccessfulPage;
