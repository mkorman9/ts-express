import { FC, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router';
import { toast } from 'react-toastify';
import { MdDelete } from 'react-icons/md';

import { useClientsAPI, Client } from './ClientsAPI';
import { useAccountInfo } from '../accounts/AccountInfo';
import { UnauthorizedError, ValidationError } from '../common/API';

export interface DeleteRecordButtonProps {
    record: Client;
    refreshData: (modifiedRecordId?: string) => void;
    disabled: boolean;
}

const DeleteRecordButton: FC<DeleteRecordButtonProps> = ({ record, refreshData, disabled }) => {
    const { t } = useTranslation();
    const history = useHistory();
    const { deleteClient } = useClientsAPI();
    const { reloadAccountInfo } = useAccountInfo();
    
    const [modalOpen, setModalOpen] = useState<boolean>(() => false);
    const [isLoading, setIsLoading] = useState<boolean>(() => false);

    const toggleModal = () => {
        setModalOpen(!modalOpen);
    };

    const handleDelete = () => {
        setIsLoading(true);

        deleteClient(record.id)
            .then(() => {
                toast.success(t('deleteRecord.successToast', { name: record.firstName + ' ' + record.lastName }), { autoClose: 2000, hideProgressBar: true, closeOnClick: true });
                toggleModal();
                refreshData();
            })
            .catch(err => {
                if (err instanceof UnauthorizedError) {
                    history.push('/login');
                } else if (err instanceof ValidationError) {
                    err.causes.forEach(cause => {
                        let field = cause.field;
                        let code = cause.code;

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
        <Button className="mb-1" onClick={toggleModal} color="danger" disabled={disabled}>
            <span><MdDelete color="white" /></span>
        </Button>

        {modalOpen && (
            <Modal isOpen={modalOpen} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>{t('deleteRecord.header')}</ModalHeader>
                <ModalBody>
                    {t('deleteRecord.message', { name: record.firstName + ' ' + record.lastName })}
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={handleDelete} disabled={isLoading}>{t('deleteRecord.deleteButton')}</Button>{' '}
                    <Button color="secondary" onClick={toggleModal}>{t('deleteRecord.cancelButton')}</Button>
                </ModalFooter>
            </Modal>
        )}
    </>);
};

export default DeleteRecordButton;
