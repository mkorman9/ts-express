import type { FC, Dispatch, SetStateAction } from 'react';

export interface RowExpanderProps {
    rowId: string;
    expanded: boolean;
    setExpandedRowId: Dispatch<SetStateAction<string | null>>;
}

const RowExpander: FC<RowExpanderProps> = ({ rowId, expanded, setExpandedRowId }) => {
    return (
        <div className="text-center">
            {!expanded && <button className="btn btn-primary-outline" onClick={() => setExpandedRowId(rowId)}>{'ᐅ'}</button>}
            {expanded && <button className="btn btn-secondary" onClick={() => setExpandedRowId(null)}>{'▼'}</button>}
        </div>
    );
};

export default RowExpander;
