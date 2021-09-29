import { FC, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { toast } from 'react-toastify';
import moment, { Moment } from 'moment';

import ClientsTableFilters from './ClientsTableFilters';
import ClientsTableHiddenColumns from './ClientsTableHiddenColumns';
import RecordActionsButtons from './RecordActionsButtons';
import AddRecordButton from './AddRecordButton';
import DeleteRecordModal from './DeleteRecordModal';
import CreditCardsList from './CreditCardsList';
import ExpandableValue from '../common/ExpandableValue';
import RowExpander from '../common/RowExpander';
import ClientChangelogWidget from './ClientChangelogWidget';
import { useDataTable, DataTableColumn, RenderCellProps } from '../common/datatable/DataTable';
import { useClientsAPI, Client, ClientChange } from './ClientsAPI';
import { useSession } from '../session/SessionProvider';
import { useLanguages } from '../common/LanguagesProvider';
import { parseQueryString } from '../common/Utils';

export interface ClientsTablePageCellRenderProps {
  refreshData: (modifiedRecordId?: string) => void;
}

const ClientsTablePage: FC<RouteComponentProps> = (props) => {
  const queryParams = useMemo(() => parseQueryString(props.location.search), [props.location.search]);
  const parseDate = (v: string | undefined): Moment | null => {
    if (!v) {
      return null;
    }

    const d = moment(v, 'YYYY-MM-DD');
    if (!d.isValid()) {
      return null;
    }

    return d;
  };

  const { t } = useTranslation();
  const { session } = useSession();
  const { currentLanguage } = useLanguages();
  const { fetchClients, getChangelogForClient } = useClientsAPI();

  const [genderFilter, setGenderFilter] = useState<string>(() => queryParams.gender || "");
  const [firstNameFilter, setFirstNameFilter] = useState<string>(() => queryParams.firstName || "");
  const [lastNameFilter, setLastNameFilter] = useState<string>(() => queryParams.lastName || "");
  const [addressFilter, setAddressFilter] = useState<string>(() => queryParams.address || "");
  const [phoneNumberFilter, setPhoneNumberFilter] = useState<string>(() => queryParams.phoneNumber || "");
  const [emailFilter, setEmailFilter] = useState<string>(() => queryParams.email || "");
  const [creditCardFilter, setCreditCardFilter] = useState<string>(() => queryParams.creditCard || "");
  const [bornAfterFilter, setBornAfterFilter] = useState<Moment | null>(() => parseDate(queryParams.bornAfter));
  const [bornBeforeFilter, setBornBeforeFilter] = useState<Moment | null>(() => parseDate(queryParams.bornBefore));

  const [clients, setClients] = useState<Client[]>(() => []);
  const [expandedClientChangelog, setExpandedClientChangelog] = useState<ClientChange[] | null>(() => null);
  const [isDirty, setIsDirty] = useState<boolean>(() => true);
  const [recordToDelete, setRecordToDelete] = useState<Client | null>(() => null);

  const columns = useMemo<DataTableColumn<Client>[]>(() => [
    {
      Header: "",
      id: 'expand',
      sortable: false,
      Cell: (props: RenderCellProps<Client>) =>
        <RowExpander rowId={props.row.values.id} expanded={props.expandedRowId === props.row.values.id} setExpandedRowId={props.setExpandedRowId} />
    },
    {
      Header: t('table.columns.actions') as string,
      id: "actions",
      requiredRoles: ["CLIENTS_EDITOR"],
      Cell: (props: RenderCellProps<Client, ClientsTablePageCellRenderProps>) =>
        <RecordActionsButtons record={props.row.values as Client} setRecordToDelete={setRecordToDelete} refreshData={props.refreshData} />
    },
    {
      Header: t('table.columns.id') as string,
      accessor: 'id',
      sortable: true,
      hideOnSmallScreen: true,
      hideable: true,
      Cell: (props: RenderCellProps<Client>) =>
        <ExpandableValue value={props.cell.value} expanded={props.expandedRowId === props.cell.value} />
    },
    {
      Header: t('table.columns.gender') as string,
      accessor: 'gender',
      sortable: true,
      hideOnSmallScreen: true,
      hideable: true
    },
    {
      Header: t('table.columns.firstName') as string,
      accessor: 'firstName',
      sortable: true
    },
    {
      Header: t('table.columns.lastName') as string,
      accessor: 'lastName',
      sortable: true
    },
    {
      Header: t('table.columns.address') as string,
      accessor: 'address',
      sortable: true,
      hideOnSmallScreen: true,
      hideable: true,
      Cell: (props: RenderCellProps<Client>) =>
        <ExpandableValue value={props.cell.value} expanded={props.expandedRowId === props.row.values.id} />
    },
    {
      Header: t('table.columns.phoneNumber') as string,
      accessor: 'phoneNumber',
      sortable: true,
      hideOnSmallScreen: true,
      hideable: true,
      Cell: (props: RenderCellProps<Client>) =>
        (props.cell.value === '') ? '-' : props.cell.value
    },
    {
      Header: t('table.columns.email') as string,
      accessor: 'email',
      sortable: true,
      hideOnSmallScreen: true,
      hideable: true,
      Cell: (props: RenderCellProps<Client>) =>
        (props.cell.value === '') ? '-' : props.cell.value
    },
    {
      Header: t('table.columns.birthDate') as string,
      accessor: 'birthDate',
      sortable: true,
      hideOnSmallScreen: true,
      hideable: true,
      Cell: (props: RenderCellProps<Client>) =>
        currentLanguage.formatDateTime(props.cell.value, 'LL')
    },
    {
      Header: t('table.columns.creditCards') as string,
      accessor: 'creditCards',
      sortable: false,
      hideOnSmallScreen: true,
      hideable: true,
      Cell: (props: RenderCellProps<Client>) =>
        <CreditCardsList value={props.cell.value} expanded={props.expandedRowId === props.row.values.id} />
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [currentLanguage]);

  const clearFilters = () => {
    setGenderFilter("");
    setFirstNameFilter("");
    setLastNameFilter("");
    setAddressFilter("");
    setPhoneNumberFilter("");
    setEmailFilter("");
    setCreditCardFilter("");
    setBornAfterFilter(null);
    setBornBeforeFilter(null);
  };

  const { DataTable,
    expandedRowId,
    currentPage,
    setCurrentPage,
    pageSize,
    setTotalPages,
    sortBy,
    sortReverse,
    setIsLoading,
    hiddenColumns,
    setHiddenColumns
  } = useDataTable<Client>(
    columns,
    clients,
    {
      initialState: {
        currentPage: () => parseInt(queryParams.page) || 0,
        pageSize: () => parseInt(queryParams.pageSize) || 10,
        sortBy: () => queryParams.sortBy || "lastName",
        sortReverse: () => queryParams.sortReverse !== undefined || false,
        expandedRowId: () => queryParams.expand,
        pageSizes: () => [1, 10, 25]
      },
      rowIdSelector: (row) => row.values.id
    }
  );

  const loadData = () => {
    setIsLoading(true);

    const pagination = {
      page: currentPage,
      pageSize: pageSize
    };
    const sorting = {
      sortBy: sortBy,
      sortReverse: sortReverse
    };
    const filters = {
      gender: genderFilter,
      firstName: firstNameFilter,
      lastName: lastNameFilter,
      address: addressFilter,
      phoneNumber: phoneNumberFilter,
      email: emailFilter,
      creditCard: creditCardFilter,
      bornAfter: bornAfterFilter,
      bornBefore: bornBeforeFilter
    };

    fetchClients(pagination, sorting, filters)
      .then(pageData => {
        if (currentPage !== 0 && currentPage >= pageData.totalPages) {
          setCurrentPage(pageData.totalPages - 1);
          return;
        }

        setClients(pageData.data);
        setTotalPages(pageData.totalPages);
      })
      .catch(err => {
        toast.error(t('table.errorLoading'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const refreshExpandedClientChangelog = (clientId: string) => {
    getChangelogForClient(clientId)
      .then(changelog => {
        setExpandedClientChangelog(changelog);
      })
      .catch(_ => {
        setExpandedClientChangelog(null);
      });
  };

  const refreshDataCallback = (modifiedRecordId?: string) => {
    setIsDirty(true);

    if (modifiedRecordId && expandedRowId === modifiedRecordId) {
      refreshExpandedClientChangelog(modifiedRecordId);
    }
  };

  const updateUrl = () => {
    const urlParams = new URLSearchParams();
    if (currentPage !== 0) {
      urlParams.append('page', String(currentPage));
    }
    if (pageSize !== 10) {
      urlParams.append('pageSize', String(pageSize));
    }

    if (genderFilter !== "") {
      urlParams.append('gender', genderFilter);
    }
    if (firstNameFilter !== "") {
      urlParams.append('firstName', firstNameFilter);
    }
    if (lastNameFilter !== "") {
      urlParams.append('lastName', lastNameFilter);
    }
    if (addressFilter !== "") {
      urlParams.append('address', addressFilter);
    }
    if (phoneNumberFilter !== "") {
      urlParams.append('phoneNumber', phoneNumberFilter);
    }
    if (emailFilter !== "") {
      urlParams.append('email', emailFilter);
    }
    if (creditCardFilter !== "") {
      urlParams.append('creditCard', creditCardFilter);
    }
    if (bornAfterFilter !== null) {
      urlParams.append('bornAfter', bornAfterFilter.format('YYYY-MM-DD'));
    }
    if (bornBeforeFilter !== null) {
      urlParams.append('bornBefore', bornBeforeFilter.format('YYYY-MM-DD'));
    }

    if (sortBy !== "lastName") {
      urlParams.append('sortBy', sortBy);
    }
    if (sortReverse) {
      urlParams.append('sortReverse', '1');
    }

    if (expandedRowId) {
      urlParams.append('expand', expandedRowId);
    }

    const url = urlParams.toString();
    if (url.length === 0) {
      window.history.replaceState(null, '', props.location.pathname);
    } else {
      window.history.replaceState(null, '', `${props.location.pathname}?${url}`);
    }
  };

  useEffect(() => {
    updateUrl();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    expandedRowId
  ]);

  useEffect(() => {
    if (expandedRowId && session.data.roles.has("CLIENTS_EDITOR")) {
      refreshExpandedClientChangelog(expandedRowId);
    } else {
      setExpandedClientChangelog(null);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    expandedRowId,
    session
  ]);

  useEffect(() => {
    setIsDirty(true);
  }, [
    currentPage,
    pageSize,
    genderFilter,
    firstNameFilter,
    lastNameFilter,
    addressFilter,
    phoneNumberFilter,
    emailFilter,
    bornAfterFilter,
    bornBeforeFilter,
    creditCardFilter,
    sortBy,
    sortReverse
  ]);

  useEffect(() => {
    if (isDirty) {
      updateUrl();
      loadData();
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDirty
  ]);

  return (
    <div className="ml-3 mr-3">
      <ClientsTableFilters
        setCurrentPage={setCurrentPage}
        filters={{
          gender: { value: genderFilter, setValue: setGenderFilter },
          firstName: { value: firstNameFilter, setValue: setFirstNameFilter },
          lastName: { value: lastNameFilter, setValue: setLastNameFilter },
          address: { value: addressFilter, setValue: setAddressFilter },
          phoneNumber: { value: phoneNumberFilter, setValue: setPhoneNumberFilter },
          email: { value: emailFilter, setValue: setEmailFilter },
          creditCard: { value: creditCardFilter, setValue: setCreditCardFilter },
          bornAfter: { value: bornAfterFilter, setValue: setBornAfterFilter },
          bornBefore: { value: bornBeforeFilter, setValue: setBornBeforeFilter },
        }}
        clearFilters={clearFilters}
      />
      <ClientsTableHiddenColumns
        hiddenColumns={hiddenColumns}
        setHiddenColumns={setHiddenColumns}
      />
      <div>
        {(session.data.roles.has("CLIENTS_EDITOR")) && (<AddRecordButton refreshData={refreshDataCallback} />)}
        <DataTable
          cellRenderProps={{
            refreshData: refreshDataCallback
          }}
          expandedRowArea={
            session.data.roles.has("CLIENTS_EDITOR") ?
              (<ClientChangelogWidget changelog={expandedClientChangelog} />) :
              null
          }
        />
        {recordToDelete && (
          <DeleteRecordModal
            record={recordToDelete}
            refreshData={refreshDataCallback}
            close={() => setRecordToDelete(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ClientsTablePage;
