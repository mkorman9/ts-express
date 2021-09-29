import { FC, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router';
import { toast } from 'react-toastify';

import { useClientsAPI, Client } from './ClientsAPI';
import { useAccountInfo } from '../accounts/AccountInfo';
import { UnauthorizedError, ValidationError } from '../common/API';

export interface DeleteRecordModalProps {
  record: Client;
  refreshData: (modifiedRecordId?: string) => void;
  close: () => void;
}

const DeleteRecordModal: FC<DeleteRecordModalProps> = ({ record, refreshData, close }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { deleteClient } = useClientsAPI();
  const { reloadAccountInfo } = useAccountInfo();

  const [isLoading, setIsLoading] = useState<boolean>(() => false);

  const handleDelete = () => {
    setIsLoading(true);

    deleteClient(record.id)
      .then(() => {
        toast.success(t('deleteRecord.successToast', { name: record.firstName + ' ' + record.lastName }), { autoClose: 2000, hideProgressBar: true, closeOnClick: true });
        refreshData();
        close();
      })
      .catch(err => {
        if (err instanceof UnauthorizedError) {
          history.push('/login');
        } else if (err instanceof ValidationError) {
          err.causes.forEach(cause => {
            const field = cause.field;
            const code = cause.code;

            if (field === "account") {
              if (code === "banned") {
                toast.error(t('deleteRecord.accountBannedError'));
                reloadAccountInfo();
              }
            }
          });
        } else {
          toast.error(t('deleteRecord.serverError'));
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (<>
    <Modal isOpen={true} toggle={close}>
      <ModalHeader toggle={close}>{t('deleteRecord.header')}</ModalHeader>
      <ModalBody>
        {t('deleteRecord.message', { name: record.firstName + ' ' + record.lastName })}
      </ModalBody>
      <ModalFooter>
        <Button color="danger" onClick={handleDelete} disabled={isLoading}>{t('deleteRecord.deleteButton')}</Button>{' '}
        <Button color="secondary" onClick={close}>{t('deleteRecord.cancelButton')}</Button>
      </ModalFooter>
    </Modal>
  </>);
};

export default DeleteRecordModal;
