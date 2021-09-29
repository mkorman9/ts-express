import type { FC } from 'react';
import { Pagination, PaginationItem, PaginationLink } from 'reactstrap';

import type { DataTablePaginationProps } from './DataTablePagination.d';

export type { DataTablePaginationProps } from './DataTablePagination.d';

const DataTablePagination: FC<DataTablePaginationProps> = ({ 
  currentPage, 
  setCurrentPage, 
  pageSize, 
  setPageSize, 
  totalPages, 
  availablePageSizes 
}) => {
  const getClosestPages = (): number[] => {
    let first = currentPage - 2;
    let last = currentPage + 3;

    while (first < 0 && first !== currentPage) {
      first += 1;
      last += 1;
    }

    while (last > totalPages && last !== currentPage) {
      if (first > 0) {
        first -= 1;
      }

      last -= 1;
    }

    return Array.from({length: (last - first)}, (_, i) => first + i);
  };

  return (
    <div>
      <Pagination className="d-flex justify-content-center" listClassName="mb-0">
        <PaginationItem disabled={currentPage === 0}>
          <PaginationLink first onClick={() => setCurrentPage(0)} />
        </PaginationItem>
        <PaginationItem disabled={currentPage === 0}>
          <PaginationLink previous onClick={() => setCurrentPage(currentPage - 1)} />
        </PaginationItem>

        {getClosestPages().map((pageNumber, i) => (
          <PaginationItem active={pageNumber === currentPage} key={i}>
            <PaginationLink onClick={() => setCurrentPage(pageNumber)}>{pageNumber + 1}</PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem disabled={currentPage === totalPages - 1}>
          <PaginationLink next onClick={() => setCurrentPage(currentPage + 1)} />
        </PaginationItem>
        <PaginationItem disabled={currentPage === totalPages - 1}>
          <PaginationLink last onClick={() => setCurrentPage(totalPages - 1)} />
        </PaginationItem>
      </Pagination>

      <Pagination size="sm" className="d-flex justify-content-center">
        {(availablePageSizes ? availablePageSizes : [5, 10, 15]).map((size, i) => (
          <PaginationItem active={pageSize === size} key={i}>
            <PaginationLink onClick={() => { setPageSize(size); setCurrentPage(0); }}>{size}</PaginationLink>
          </PaginationItem>
        ))}
      </Pagination>
    </div>
  );
};

export default DataTablePagination;
