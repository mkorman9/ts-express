import type { FC, ReactNode, Dispatch, SetStateAction } from 'react';
import type { Column, ColumnInstance, IdType, Row, CellProps } from 'react-table';

export interface ExtraColumnProps {
  sortable?: boolean;
  hideOnSmallScreen?: boolean;
  hideable?: boolean;
  requiredRoles?: string[];
  invisible?: boolean;
}

export type DataTableColumn<D extends object> = Column<D> & ExtraColumnProps;
export type DataTableColumnInstance<D extends object> = ColumnInstance<D> & ExtraColumnProps;

export type DataTableRow<D extends object> = Row<D>;

export type ColumnId<D extends object> = IdType<D>;
export type RowId = string;

export type RowIdSelectorFunc<D extends object> = ((row: DataTableRow<D>) => RowId);

export interface TableExtraProps<D extends object> {
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  pageSize: number;
  setPageSize: Dispatch<SetStateAction<number>>;
  totalPages: number;
  setTotalPages: Dispatch<SetStateAction<number>>;
  sortBy: ColumnId<D>;
  setSortBy: Dispatch<SetStateAction<ColumnId<D>>>;
  sortReverse: boolean;
  setSortReverse: Dispatch<SetStateAction<boolean>>;
  expandedRowId: RowId | null,
  setExpandedRowId: Dispatch<SetStateAction<RowId | null>>;
  hiddenColumns: Set<ColumnId<D>>;
  setHiddenColumns: Dispatch<SetStateAction<Set<ColumnId<D>>>>;
}
export type RenderCellProps<D extends object, CR = {}, V = any> = 
    CellProps<D, V>
    & TableExtraProps<D> 
    & CR;

export interface UseDataTableProps<D extends object> {
  rowIdSelector?: RowIdSelectorFunc<D>;
  initialState?: {
    isLoading?: () => boolean;
    currentPage?: () => number;
    pageSize?: () => number;
    totalPages?: () => number;
    pageSizes?: () => number[];
    sortBy?: () => ColumnId<D>;
    sortReverse?: () => boolean;
    expandedRowId?: () => RowId | null;
    hiddenColumns?: () => Set<ColumnId<D>>; 
  };
}

export interface DataTableComponentProps {
  cellRenderProps?: object;
  expandedRowArea?: ReactNode;
}

export interface UseDataTableResult<D extends object> {
  DataTable: FC<DataTableComponentProps>; 
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  pageSize: number;
  setPageSize: Dispatch<SetStateAction<number>>;
  totalPages: number;
  setTotalPages: Dispatch<SetStateAction<number>>;
  sortBy: ColumnId<D>;
  setSortBy: Dispatch<SetStateAction<ColumnId<D>>>;
  sortReverse: boolean;
  setSortReverse: Dispatch<SetStateAction<boolean>>;
  expandedRowId: RowId | null,
  setExpandedRowId: Dispatch<SetStateAction<RowId | null>>;
  hiddenColumns: Set<ColumnId<D>>;
  setHiddenColumns: Dispatch<SetStateAction<Set<ColumnId<D>>>>;
}
