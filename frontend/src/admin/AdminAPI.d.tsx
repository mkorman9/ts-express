import type { PaginationSettings, SortingSettings } from '../common/API';
import type { AccountsFilters, AccountsInfoPage } from '../accounts/AccountAPI';
import type { SessionData } from '../session/SessionAPI';

export interface AdminAPIContextType {
  listAllAccounts: (pagination: PaginationSettings, sorting: SortingSettings, filters: AccountsFilters) => Promise<AccountsInfoPage>;
  setRolesForAccount: (accountId: string, roles: string[]) => Promise<void>;
  impersonate: (accountId: string) => Promise<SessionData>;
}
