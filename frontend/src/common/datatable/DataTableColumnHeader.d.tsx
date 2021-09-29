import type { Dispatch, SetStateAction } from 'react';

import type { DataTableColumnInstance, ColumnId } from './DataTable.d';

export interface DataTableColumnHeaderProps<D extends object> {
    column: DataTableColumnInstance<D>;
    sortBy: ColumnId<D>;
    sortReverse: boolean;
    setSortBy: Dispatch<SetStateAction<ColumnId<D>>>;
    setSortReverse: Dispatch<SetStateAction<boolean>>;
    hiddenColumns: Set<ColumnId<D>>;
    setHiddenColumns: Dispatch<SetStateAction<Set<ColumnId<D>>>>;
}
