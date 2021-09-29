import { FC, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form } from 'reactstrap';
import { AiOutlineClose } from 'react-icons/ai';

export interface ClientsTableHiddenColumnsProps {
    hiddenColumns: Set<string>;
    setHiddenColumns: Dispatch<SetStateAction<Set<string>>>;
}

const ClientsTableHiddenColumns: FC<ClientsTableHiddenColumnsProps> = ({ hiddenColumns, setHiddenColumns }) => {
    const { t } = useTranslation();

    if (!hiddenColumns || hiddenColumns.size === 0) {
        return null;
    }

    const showColumn = (column: string) => {
        setHiddenColumns(new Set(Array.from(hiddenColumns).filter(c => c !== column)));
    };

    return (
        <Form className="mt-4 mb-4 p-3 border">
            <div className="mb-1">{t('table.hiddenColumns')}</div>
            <div className="d-inline-block" style={{lineHeight: "3rem"}}>
                {Array.from(hiddenColumns).map((column, i) => {
                    return (
                        <span key={i} className="mr-3 mb-2">
                            <Button color="primary" onClick={() => showColumn(column)} outline>
                                <span className="float-left mr-4">
                                    {t(`table.columns.${column}`)}
                                </span>
                                <span className="float-right">
                                    <AiOutlineClose />
                                </span>
                                <span className="clearfix"></span>
                            </Button> 
                        </span>
                    );
                })}
            </div>
        </Form>
    );
};

export default ClientsTableHiddenColumns;
