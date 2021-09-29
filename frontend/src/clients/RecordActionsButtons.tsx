import { Dispatch, FC, SetStateAction, useState } from 'react';

import DeleteRecordButton from './DeleteRecordButton';
import EditRecordButton from './EditRecordButton';
import { useAccountInfo } from '../accounts/AccountInfo';
import type { Client } from './ClientsAPI';

export interface RecordActionsButtonsProps {
  record: Client;
  setRecordToDelete: Dispatch<SetStateAction<Client | null>>;
  setRecordToEdit: Dispatch<SetStateAction<Client | null>>;
}

const RecordActionsButtons: FC<RecordActionsButtonsProps> = ({ record, setRecordToDelete, setRecordToEdit }) => {
  const { useLoadedAccountInfo } = useAccountInfo();
  const [disabled, setDisabled] = useState<boolean>(() => false);

  useLoadedAccountInfo((accountInfo) => {
    setDisabled(accountInfo.data.isBanned);
  });

  return (<>
    <DeleteRecordButton onClick={() => setRecordToDelete(record)} disabled={disabled} />
    {' '}
    <EditRecordButton onClick={() => setRecordToEdit(record)} disabled={disabled} />
  </>);
};

export default RecordActionsButtons;
