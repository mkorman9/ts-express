import type { Dispatch, SetStateAction } from 'react';

export interface DataTablePaginationProps {
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  pageSize: number;
  setPageSize: Dispatch<SetStateAction<number>>;
  totalPages: number;
  availablePageSizes?: number[];
}
