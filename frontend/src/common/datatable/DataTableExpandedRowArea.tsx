import type { PropsWithChildren } from 'react';

import type { DataTableExpandedRowAreaProps } from './DataTableExpandedRowArea.d';

export type { DataTableExpandedRowAreaProps } from './DataTableExpandedRowArea.d';

const DataTableExpandedRowArea = <D extends object>({ 
  visibleColumns, 
  view 
}: PropsWithChildren<DataTableExpandedRowAreaProps<D>>) => {
  if (!view) {
    return null;
  }

  return (
    <tr>
      <td colSpan={visibleColumns.length}>
        <div className="ml-4">
          {view}
        </div>
      </td>
    </tr>
  );
}

export default DataTableExpandedRowArea;
