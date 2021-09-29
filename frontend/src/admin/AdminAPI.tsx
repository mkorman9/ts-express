import { FC, createContext, useContext } from 'react';
import moment from 'moment';

import { useSession } from '../session/SessionProvider';
import { callGet, callPost } from '../common/API';
import type { PaginationSettings, SortingSettings } from '../common/API';
import type { AccountsFilters, AccountsInfoPage, AccountsInfoPageResponse } from '../accounts/AccountAPI';
import type { SessionData, SessionDataResponse } from '../session/SessionAPI';
import type { AdminAPIContextType } from './AdminAPI.d';

export type { AdminAPIContextType } from './AdminAPI.d';

const AdminAPIContext = createContext<AdminAPIContextType>({} as AdminAPIContextType);

export const AdminAPIProvider: FC = (props: any) => {
  const { session } = useSession();
  const accessToken = session.data.accessToken;

  const listAllAccounts = (pagination: PaginationSettings, sorting: SortingSettings, filters: AccountsFilters): Promise<AccountsInfoPage> => {
    return callGet<AccountsInfoPageResponse>(`/api/v1/admin/accounts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,

        sortBy: sorting.sortBy,
        sortReverse: sorting.sortReverse ? 1 : undefined,

        'filter[username]': filters.username || undefined,
      }
    })
      .then(response => ({
        data: (!response.data.data) ? [] : response.data.data.map(account => {
          return {
            id: account.id,
            username: account.username,
            email: account.email,
            language: account.language,
            registeredAt: moment.utc(account.registeredAt),
            roles: account.roles || [],
            isActive: account.isActive,
            isBanned: account.isBanned,
            bannedUntil: (account.bannedUntil) ? moment.utc(account.bannedUntil) : null,
            loginMethods: {
              emailAndPassword: {
                defined: Boolean(account.loginMethods.emailAndPassword.defined)
              },
              github: {
                defined: Boolean(account.loginMethods.github.defined)
              }
            }
          }
        }),
        totalPages: response.data.totalPages
      }));
  };

  const setRolesForAccount = (accountId: string, roles: string[]): Promise<void> => {
    return callPost('/api/v1/admin/set/roles', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        accountId: accountId, 
        roles: roles
      },
    })
      .then(() => {
      });
  };

  const impersonate = (accountId: string): Promise<SessionData> => {
    return callPost<SessionDataResponse>('/api/v1/admin/impersonate', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        accountId: accountId
      },
    })
      .then(response => ({
        id:          response.data.id,
        accessToken: response.data.accessToken,
        roles:       new Set(response.data.roles),
      }));
  };

  return (
    <AdminAPIContext.Provider value={{ 
      listAllAccounts, 
      setRolesForAccount, 
      impersonate 
    }}>
      {props.children}
    </AdminAPIContext.Provider>
  );
};

export const useAdminAPI = () => useContext(AdminAPIContext);
