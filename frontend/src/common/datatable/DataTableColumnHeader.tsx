import type { PropsWithChildren } from 'react';
import { AiOutlineCloseCircle } from 'react-icons/ai';

import type { ColumnId } from './DataTable.d';
import type { DataTableColumnHeaderProps } from './DataTableColumnHeader.d';

export type { DataTableColumnHeaderProps } from './DataTableColumnHeader.d';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const DataTableColumnHeader = <D extends object>({
  column,
  sortBy,
  sortReverse,
  setSortBy,
  setSortReverse,
  hiddenColumns,
  setHiddenColumns
}: PropsWithChildren<DataTableColumnHeaderProps<D>>) => {
  const sortable = (column.sortable);
  const isSortedBy = (column.id === sortBy);
  const hideable = (column.hideable);
  const isHidden = hiddenColumns.has(column.id as ColumnId<D>);

  const handleSortButtonClick = () => {
    if (!sortable) {
      return;
    }

    if (isSortedBy) {
      setSortReverse(!sortReverse);
    } else {
      setSortBy(column.id as ColumnId<D>);
      setSortReverse(false);
    }
  };

  const handleHideButtonClick = () => {
    if (!hideable || isHidden) {
      return;
    }

    setHiddenColumns(new Set([...hiddenColumns, column.id as ColumnId<D>]));
  };

  return (<>
    <div className={"float-left " + (hideable ? "w-75" : "w-100")} onClick={(e) => handleSortButtonClick()}>
      {column.render('Header')}
      {sortable && <span>{(isSortedBy ? (sortReverse ? ' ↑' : ' ↓') : '')}</span>}
    </div>

    {hideable && (
      <div className="float-right" onClick={(e) => handleHideButtonClick()}>
        <AiOutlineCloseCircle />
      </div>
    )}

    <div className="clearfix"></div>
  </>);
}

export default DataTableColumnHeader;
