import { FC, useState } from 'react';

import DeleteRecordButton from './DeleteRecordButton';
import EditRecordButton from './EditRecordButton';
import { useAccountInfo } from '../accounts/AccountInfo';
import type { Client } from './ClientsAPI';

export interface RecordActionsButtonsProps {
    record: Client;
    refreshData: (modifiedRecordId?: string) => void;
}

const RecordActionsButtons: FC<RecordActionsButtonsProps> = ({ record, refreshData }) => {
    const { useLoadedAccountInfo } = useAccountInfo();
    const [disabled, setDisabled] = useState<boolean>(() => false);

    useLoadedAccountInfo((accountInfo) => {
        setDisabled(accountInfo.data.isBanned);
    });

    return (<>
        <DeleteRecordButton record={record} refreshData={refreshData} disabled={disabled} />
        {' '}
        <EditRecordButton record={record} refreshData={refreshData} disabled={disabled} />
    </>);
};

export default RecordActionsButtons;
