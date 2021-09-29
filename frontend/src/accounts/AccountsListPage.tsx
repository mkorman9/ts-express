import { FC, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, FormGroup, Label, Input, Form, Spinner, Badge } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps, useHistory } from 'react-router';
import { toast } from 'react-toastify';
import moment from 'moment';

import { AccountInfo } from './AccountAPI';
import { useDataTable, DataTableColumn, RenderCellProps } from '../common/datatable/DataTable';
import { useSession } from '../session/SessionProvider';
import { useAdminAPI } from '../admin/AdminAPI';
import { useLanguages } from '../common/LanguagesProvider';
import RolesBadges from '../common/RolesBadges';
import ExpandableValue from '../common/ExpandableValue';
import RowExpander from '../common/RowExpander';
import { parseQueryString } from '../common/Utils';

const AccountsListPage: FC<RouteComponentProps> = (props) => {
  const queryParams = useMemo(() => parseQueryString(props.location.search), [props.location.search]);

  const { t } = useTranslation();
  const { session } = useSession();
  const history = useHistory();
  const { listAllAccounts } = useAdminAPI();
  const { currentLanguage } = useLanguages();

  const [usernameFilter, setUsernameFilter] = useState<string>(() => queryParams.username || "");
  const [hasRoles, setHasRoles] = useState(false);
  const [data, setData] = useState<AccountInfo[]>([]);

  const columns = useMemo<DataTableColumn<AccountInfo>[]>(() => [
    {
      Header: "",
      id: 'expand',
      sortable: false,
      Cell: (props: RenderCellProps<AccountInfo>) => 
        <RowExpander rowId={props.row.values.id} expanded={props.expandedRowId === props.row.values.id} setExpandedRowId={props.setExpandedRowId} />
    },
    {
      Header: t('accountsListPage.table.id') as string,
      accessor: 'id',
      sortable: true,
      hideOnSmallScreen: true,
      Cell: (props: RenderCellProps<AccountInfo>) => 
        <ExpandableValue value={props.cell.value} expanded={props.expandedRowId === props.row.values.id} />
    },
    {
      Header: t('accountsListPage.table.profile') as string,
      accessor: 'username',
      sortable: true,
      Cell: (props: RenderCellProps<AccountInfo>) => {
        if (props.cell.row.values.isActive) {
          return (
            <Link to={`/profile/id/${props.cell.row.values.id}`}>{props.cell.value}</Link>
          );
        } else {
          return (
            <i>{props.cell.value}  <Badge color="secondary">{t('accountsListPage.inactive').toUpperCase()}</Badge></i>
          );
        }
      }
    },
    {
      Header: t('accountsListPage.table.email') as string,
      accessor: 'email',
      hideOnSmallScreen: true
    },
    {
      Header: t('accountsListPage.table.roles') as string,
      accessor: "roles",
      Cell: (props: RenderCellProps<AccountInfo>) => 
        <RolesBadges assignedRoles={props.cell.value} />
    },
    {
      Header: t('accountsListPage.table.registeredAt') as string,
      accessor: "registeredAt",
      sortable: true,
      hideOnSmallScreen: true,
      Cell: (props: RenderCellProps<AccountInfo>) => 
        currentLanguage.formatDateTime(props.cell.value.tz(moment.tz.guess()))
    },
    {
      accessor: 'isActive',
      invisible: true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [currentLanguage]);

  const { DataTable, currentPage, setCurrentPage, pageSize, setTotalPages, sortBy, sortReverse, expandedRowId, setIsLoading } = useDataTable<AccountInfo>(
    columns, 
    data, 
    {
      initialState: {
        currentPage: () => parseInt(queryParams.page) || 0,
        pageSize: () => parseInt(queryParams.pageSize) || 10,
        sortBy: () => queryParams.sortBy || "username",
        sortReverse: () => queryParams.sortReverse !== undefined || false,
        expandedRowId: () => queryParams.expand
      },
      rowIdSelector: (row) => row.values.id
    }
  );

  const updateUrl = () => {
    const urlParams = new URLSearchParams();
    if (currentPage !== 0) {
      urlParams.append('page', String(currentPage));
    }
    if (pageSize !== 10) {
      urlParams.append('pageSize', String(pageSize));
    }
        
    if (usernameFilter !== "") {
      urlParams.append('username', String(usernameFilter));
    }

    if (sortBy !== "username") {
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

  const loadData = () => {
    const pagination = {
      page: currentPage,
      pageSize: pageSize
    };
    const sorting = {
      sortBy: sortBy,
      sortReverse: sortReverse
    };
    const filters = {
      username: usernameFilter, 
    };

    listAllAccounts(pagination, sorting, filters)
      .then(accountsPage => {
        if (currentPage !== 0 && currentPage >= accountsPage.totalPages) {
          setCurrentPage(accountsPage.totalPages - 1);
          return;
        }

        setData(accountsPage.data);
        setTotalPages(accountsPage.totalPages);
        updateUrl();
      })
      .catch(err => {
        toast.error(t('accountsListPage.serverError'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (session.isStillLoading) {
      return;
    }
        
    if (!session.isActive || !session.data.roles.has('PERMISSIONS_ADMIN')) {
      history.push('/');
      return;
    }

    setHasRoles(true);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session,
    currentPage,
    pageSize,
    sortBy,
    sortReverse,
    usernameFilter
  ]);

  useEffect(() => {
    updateUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    expandedRowId
  ]);

  if (!hasRoles) {
    return <Spinner />;
  }

  return (
    <div className="ml-3 mr-3 mt-3">
      <Form className="mt-4 mb-4 p-2 border">
        {usernameFilter !== "" && (<>
          <div className="float-right">
            <Button color="link" onClick={() => setUsernameFilter("")} className="mt-0 pt-0">{t('accountsListPage.filters.clearFilters')}</Button>
          </div>
        </>)}

        <br />

        <FormGroup>
          <Label for="username">{t('accountsListPage.filters.username')}</Label>
          <Input type="text" name="username" id="username"
            value={usernameFilter}
            onChange={e => setUsernameFilter(e.target.value)}
          />
        </FormGroup>
      </Form>

      <DataTable />
    </div>
  );
};

export default AccountsListPage;
