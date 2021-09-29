import type { ReactNode } from 'react';

import type { DataTableColumnInstance } from './DataTable.d';

export interface DataTableExpandedRowAreaProps<D extends object> {
    visibleColumns: DataTableColumnInstance<D>[];
    view?: ReactNode;
}
