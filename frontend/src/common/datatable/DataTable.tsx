import React, { FC, useEffect, useState } from 'react';
import { useTable } from 'react-table';
import { Table, Spinner } from 'reactstrap';

import DataTableColumnHeader from './DataTableColumnHeader';
import DataTableExpandedRowArea from './DataTableExpandedRowArea';
import DataTablePagination from './DataTablePagination';
import { useSession } from '../../session/SessionProvider';
import { useScreenSizeDependentContent } from '../../common/ScreenSizeDependentContentProvider';
import './DataTable.scss';
import type { 
    DataTableColumn, 
    DataTableColumnInstance, 
    DataTableRow,
    ColumnId, 
    RowId, 
    RowIdSelectorFunc,
    UseDataTableProps, 
    DataTableComponentProps,
    UseDataTableResult
} from './DataTable.d';

export type {
    ExtraColumnProps,
    DataTableColumn, 
    DataTableColumnInstance, 
    DataTableRow,
    ColumnId, 
    RowId, 
    RowIdSelectorFunc,
    TableExtraProps,
    RenderCellProps,
    UseDataTableProps, 
    DataTableComponentProps,
    UseDataTableResult
} from './DataTable.d';

export function useDataTable<D extends object = {}>(
    columns: DataTableColumn<D>[], 
    data: D[], 
    props?: UseDataTableProps<D>
): UseDataTableResult<D> {
    const rowIdSelector: RowIdSelectorFunc<D> = (props && props.rowIdSelector) ? props.rowIdSelector : ((row: DataTableRow<D>) => row.id);

    const { session } = useSession();
    const { isOnSmallScreen } = useScreenSizeDependentContent();

    const [initialized, setInitialized] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(
        () => (props && props.initialState && props.initialState.isLoading) ? props.initialState.isLoading() : true
    );

    const [currentPage, setCurrentPage] = useState<number>(
        () => (props && props.initialState && props.initialState.currentPage) ? props.initialState.currentPage() : 0
    );
    const [pageSize, setPageSize] = useState<number>(
        () => (props && props.initialState && props.initialState.pageSize) ? props.initialState.pageSize() : 0
    );
    const [totalPages, setTotalPages] = useState<number>(
        () => (props && props.initialState && props.initialState.totalPages) ? props.initialState.totalPages() : 1
    );
    const [availablePageSizes, setAvailablePageSizes] = useState<number[]>(
        () => (props && props.initialState && props.initialState.pageSizes) ? props.initialState.pageSizes() : [5, 10, 15]
    );
    
    const [sortBy, setSortBy] = useState<ColumnId<D>>(
        () => (props && props.initialState && props.initialState.sortBy) ? props.initialState.sortBy() : ""
    );
    const [sortReverse, setSortReverse] = useState<boolean>(
        () => (props && props.initialState && props.initialState.sortReverse) ? props.initialState.sortReverse() : false
    );

    const [expandedRowId, setExpandedRowId] = useState<RowId | null>(
        () => (props && props.initialState && props.initialState.expandedRowId) ? props.initialState.expandedRowId() : null
    );
    const [expandedRow, setExpandedRow] = useState<DataTableRow<D> | null>(null);

    const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnId<D>>>(
        () => (props && props.initialState && props.initialState.hiddenColumns) ? props.initialState.hiddenColumns() : new Set()
    );

    const { getTableProps, getTableBodyProps, headerGroups, allColumns, visibleColumns, rows, prepareRow } = useTable<D>({ 
        columns, 
        data
    });

    useEffect(() => {
        const hiddenColumnsCopy = new Set(hiddenColumns);

        allColumns.map(c => c as DataTableColumnInstance<D>).filter(c => c.hideOnSmallScreen).forEach(column => {
            if (isOnSmallScreen) {
                hiddenColumnsCopy.add(column.id);
            } else {
                hiddenColumnsCopy.delete(column.id);
            }
        });

        setHiddenColumns(hiddenColumnsCopy);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isOnSmallScreen
    ]);

    useEffect(() => {
        allColumns.map(c => c as DataTableColumnInstance<D>).forEach((column) => {
            let hide = hiddenColumns ? hiddenColumns.has(column.id) : false;
            if (column.invisible) {
                hide = true;
            }

            if (!hide && column.requiredRoles) {
                hide = !column.requiredRoles.some(role => session.data.roles.has(role));
            }

            column.toggleHidden(hide);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        session, 
        columns, 
        hiddenColumns
    ]);

    useEffect(() => {
        if (!initialized) {
            if (!data || data.length === 0 || !rows || rows.length === 0) {
                return;
            }

            setInitialized(true);
        }

        if (!expandedRowId) {
            setExpandedRow(null);
            return;
        }

        const row = rows.find((row) => expandedRowId === rowIdSelector(row));
        if (!row) {
            setExpandedRowId(null);
            setExpandedRow(null);
            return;
        }

        if (!expandedRow || expandedRow.id !== row.id || rowIdSelector(expandedRow) !== rowIdSelector(row)) {
            setExpandedRow(row);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        data, 
        rows, 
        expandedRowId
    ]);

    const DataTable: FC<DataTableComponentProps> = ({ cellRenderProps, expandedRowArea }) => (<>
        <div className="dataTableContainer">
            <Table {...getTableProps()} bordered hover>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                <th {...column.getHeaderProps()}>
                                    <DataTableColumnHeader<D>
                                        column={column}
                                        sortBy={sortBy}
                                        sortReverse={sortReverse}
                                        setSortBy={setSortBy}
                                        setSortReverse={setSortReverse}
                                        hiddenColumns={hiddenColumns}
                                        setHiddenColumns={setHiddenColumns}
                                    />
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {isLoading && (
                        <tr>
                            <td colSpan={visibleColumns.length} className="text-center">
                                <Spinner />
                            </td>
                        </tr>
                    )}
                    {!isLoading && rows.map((row, key) => {
                        prepareRow(row);
                        return (<React.Fragment key={key}>
                            <tr {...row.getRowProps()}>
                                {row.cells.map((cell) => {
                                    return (
                                        <td {...cell.getCellProps()}>
                                            {cell.render('Cell', {
                                                ...(cellRenderProps || {}),
                                                currentPage,
                                                setCurrentPage,
                                                pageSize,
                                                setPageSize,
                                                totalPages,
                                                setTotalPages,
                                                sortBy,
                                                setSortBy,
                                                sortReverse,
                                                setSortReverse,
                                                expandedRowId,
                                                setExpandedRowId,
                                                hiddenColumns,
                                                setHiddenColumns
                                            })}
                                        </td>
                                    );
                                })}
                            </tr>
                            
                            <DataTableExpandedRowArea<D>
                                visibleColumns={visibleColumns}
                                view={(expandedRowArea && expandedRowId === rowIdSelector(row)) ? expandedRowArea : null}
                            />
                        </React.Fragment>);
                    })}
                </tbody>
            </Table>
        </div>

        <DataTablePagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            totalPages={totalPages}
            availablePageSizes={availablePageSizes}
        />
    </>);

    return {
        ...{ 
            DataTable, 
            isLoading, 
            setIsLoading 
        },
        ...{ 
            currentPage,
            setCurrentPage,
            pageSize,
            setPageSize,
            totalPages,
            setTotalPages,
            availablePageSizes,
            setAvailablePageSizes
        },
        ...{
            sortBy,
            setSortBy,
            sortReverse,
            setSortReverse
        },
        ...{
            expandedRowId,
            setExpandedRowId
        },
        ...{
            hiddenColumns,
            setHiddenColumns
        }
    };
}
