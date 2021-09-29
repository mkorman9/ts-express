import type { Moment } from 'moment';

import type { PaginationSettings, SortingSettings, ErrorCause } from '../common/API';

export interface CreditCard {
    number: string;
}

export interface Client {
    id: string;
    gender: string;
    firstName: string;
    lastName: string;
    address: string;
    phoneNumber: string;
    email: string;
    birthDate: Moment | null;
    creditCards: CreditCard[];
}

export interface ClientPayload {
    gender?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    birthDate?: Moment;
    creditCards?: CreditCard[];
}

export interface ClientsPage {
    data: Client[];
    totalPages: number;
}

export interface CreditCardResponse {
    number: string;
}

export interface ClientResponse {
    id: string;
    gender: string;
    firstName: string;
    lastName: string;
    address: string;
    phoneNumber: string;
    email: string;
    birthDate: string | null;
    creditCards: CreditCardResponse[];
}

export interface ClientsPageResponse {
    data: ClientResponse[];
    totalPages: number;
}

export interface ClientsFilters {
    gender: string;
    firstName: string;
    lastName: string;
    address: string ;
    phoneNumber: string;
    email: string;
    creditCard: string;
    bornAfter: Moment | null;
    bornBefore: Moment | null;
}

export interface ClientChangeField {
    field: string;
    new: string;
    old?: string;
}

export interface ClientChange {
    timestamp: Moment;
    type: string;
    authorId: string;
    authorUsername: string;
    changeset: ClientChangeField[];
}

export interface ClientChangeFieldResponse {
    field: string;
    new: string;
    old?: string;
}

export interface ClientChangeResponse {
    timestamp: string;
    type: string;
    authorId: string;
    authorUsername: string;
    changeset: ClientChangeFieldResponse[];
}

export interface ClientErrorCause extends ErrorCause {
    creditCardIndex: number | null;
}

export interface ClientAddIdResponse {
    id: string;
}

export interface ClientsAPIContextType {
    fetchClients: (pagination: PaginationSettings, sorting: SortingSettings, filters: ClientsFilters) => Promise<ClientsPage>;
    getChangelogForClient: (clientId: string) => Promise<ClientChange[]>;
    addClient: (client: ClientPayload) => Promise<string>;
    updateClient: (id: string, payload: ClientPayload) => Promise<void>;
    deleteClient: (id: string) => Promise<void>;
}
