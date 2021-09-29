import { FC, createContext, useContext } from 'react';
import moment from 'moment';

import { useSession } from '../session/SessionProvider';
import { callGet, callPost, callPut, callDelete, ValidationError } from '../common/API';
import type { PaginationSettings, SortingSettings, ErrorCause } from '../common/API';
import type {
  ClientPayload,
  ClientsPage,
  ClientsPageResponse,
  ClientsFilters,
  ClientChange,
  ClientChangeResponse,
  ClientErrorCause,
  ClientAddIdResponse,
  ClientsAPIContextType
} from './ClientsAPI.d';

export type {
  CreditCard,
  Client,
  ClientPayload,
  ClientsPage,
  CreditCardResponse,
  ClientResponse,
  ClientsPageResponse,
  ClientsFilters,
  ClientChangeField,
  ClientChange,
  ClientChangeFieldResponse,
  ClientChangeResponse,
  ClientErrorCause,
  ClientAddIdResponse,
  ClientsAPIContextType
} from './ClientsAPI.d';

function _processValidationErrorCauses(causes: Array<ErrorCause>): Array<ClientErrorCause> {
  return causes.map(c => {
    const cause: ClientErrorCause = { field: c.field, code: c.code, creditCardIndex: null };

    const creditCardMatch = cause.field.match(/creditCards\[(\d+)\]\.number/);
    if (creditCardMatch) {
      cause.field = "creditCards.number";
      cause.creditCardIndex = Number(creditCardMatch[1]);
    }

    return cause;
  });
}

const ClientsAPIContext = createContext<ClientsAPIContextType>({} as ClientsAPIContextType);

export const ClientsAPIProvider: FC = (props: any) => {
  const { session } = useSession();
  const accessToken = session.data.accessToken;

  const fetchClients = (pagination: PaginationSettings, sorting: SortingSettings, filters: ClientsFilters): Promise<ClientsPage> => {
    return callGet<ClientsPageResponse>('/api/v1/client', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,

        sortBy: sorting.sortBy,
        sortReverse: sorting.sortReverse ? 1 : undefined,

        'filter[gender]': filters.gender || undefined,
        'filter[firstName]': filters.firstName || undefined,
        'filter[lastName]': filters.lastName || undefined,
        'filter[address]': filters.address || undefined,
        'filter[phoneNumber]': filters.phoneNumber || undefined,
        'filter[email]': filters.email || undefined,
        'filter[bornAfter]': filters.bornAfter ? filters.bornAfter.format('YYYY-MM-DD') : undefined,
        'filter[bornBefore]': filters.bornBefore ? filters.bornBefore.format('YYYY-MM-DD') : undefined,
        'filter[creditCard]': filters.creditCard || undefined,
      }
    })
      .then(response => {
        const page = response.data;
        return {
          data: (page.data === null) ? [] : page.data.map(record => {
            return {
              id: record.id,
              gender: record.gender,
              firstName: record.firstName,
              lastName: record.lastName,
              address: record.address,
              phoneNumber: record.phoneNumber,
              email: record.email,
              birthDate: (!record.birthDate) ? null : moment.utc(record.birthDate),
              creditCards: !record.creditCards ? [] : record.creditCards.map(creditCard => ({
                number: creditCard.number
              }))
            }
          }),
          totalPages: page.totalPages
        };
      });
  };

  const getChangelogForClient = (clientId: string): Promise<ClientChange[]> => {
    return callGet<ClientChangeResponse[]>(`/api/v1/client/${clientId}/changelog`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
    })
      .then(response => {
        return !response.data ? [] : response.data.map(change => ({
          timestamp: moment.utc(change.timestamp),
          type: change.type,
          authorId: change.authorId,
          authorUsername: change.authorUsername,
          changeset: !change.changeset ? [] : change.changeset.map(changesetItem => ({
            field: changesetItem.field,
            new: changesetItem.new,
            old: changesetItem.old
          }))
        }));
      });
  };

  const addClient = (client: ClientPayload): Promise<string> => {
    return callPost<ClientAddIdResponse>('/api/v1/client', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: client
    })
      .then(response => {
        return response.data.id;
      })
      .catch(err => {
        if (err instanceof ValidationError) {
          throw new ValidationError(_processValidationErrorCauses(err.causes));
        }

        throw err;
      });
  };

  const updateClient = (id: string, payload: ClientPayload): Promise<void> => {
    return callPut(`/api/v1/client/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: payload
    })
      .then(() => {
      })
      .catch(err => {
        if (err instanceof ValidationError) {
          throw new ValidationError(_processValidationErrorCauses(err.causes));
        }

        throw err;
      });
  };

  const deleteClient = (id: string): Promise<void> => {
    return callDelete(`/api/v1/client/${id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then(() => {
      });
  };

  return (
    <ClientsAPIContext.Provider value={{
      fetchClients,
      getChangelogForClient,
      addClient,
      updateClient,
      deleteClient
    }}>
      {props.children}
    </ClientsAPIContext.Provider>
  );
};

export const useClientsAPI = () => useContext(ClientsAPIContext);
