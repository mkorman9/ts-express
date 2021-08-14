import { Moment } from 'moment';

export interface ClientDescriptor {
    gender?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    birthDate?: Moment | null;
    creditCards?: { number: string }[];
}

export interface ClientChangeItem {
    field: string;
    old?: string;
    new: string;
}

export const generateClientChangeset = (oldData: ClientDescriptor, newData: ClientDescriptor): ClientChangeItem[] => {
    const oldDataPayload = {
        gender: oldData.gender || '',
        firstName: oldData.firstName || '',
        lastName: oldData.lastName || '',
        address: oldData.address || '',
        phoneNumber: oldData.phoneNumber || '',
        email: oldData.email || '',
        birthDate: oldData.birthDate ? oldData.birthDate.format() : '',
        creditCards: (oldData.creditCards || []).map(cc => cc.number).sort().join(',')
    };
    const newDataPayload = {
        gender: newData.gender || '',
        firstName: newData.firstName || '',
        lastName: newData.lastName || '',
        address: newData.address || '',
        phoneNumber: newData.phoneNumber || '',
        email: newData.email || '',
        birthDate: newData.birthDate ? newData.birthDate.format() : '',
        creditCards: (newData.creditCards || []).map(cc => cc.number).sort().join(',')
    };

    let ret: ClientChangeItem[] = [];

    if (oldDataPayload.gender !== newDataPayload.gender) {
        ret.push({
            field: 'gender',
            old: oldDataPayload.gender || undefined,
            new: newDataPayload.gender
        });
    }
    if (oldDataPayload.firstName !== newDataPayload.firstName) {
        ret.push({
            field: 'firstName',
            old: oldDataPayload.firstName || undefined,
            new: newDataPayload.firstName
        });
    }
    if (oldDataPayload.lastName !== newDataPayload.lastName) {
        ret.push({
            field: 'lastName',
            old: oldDataPayload.lastName || undefined,
            new: newDataPayload.lastName
        });
    }
    if (oldDataPayload.address !== newDataPayload.address) {
        ret.push({
            field: 'address',
            old: oldDataPayload.address || undefined,
            new: newDataPayload.address
        });
    }
    if (oldDataPayload.phoneNumber !== newDataPayload.phoneNumber) {
        ret.push({
            field: 'phoneNumber',
            old: oldDataPayload.phoneNumber || undefined,
            new: newDataPayload.phoneNumber
        });
    }
    if (oldDataPayload.email !== newDataPayload.email) {
        ret.push({
            field: 'email',
            old: oldDataPayload.email || undefined,
            new: newDataPayload.email
        });
    }
    if (oldDataPayload.birthDate !== newDataPayload.birthDate) {
        ret.push({
            field: 'birthDate',
            old: oldDataPayload.birthDate || undefined,
            new: newDataPayload.birthDate
        });
    }
    if (oldDataPayload.creditCards !== newDataPayload.creditCards) {
        ret.push({
            field: 'creditCards',
            old: oldDataPayload.creditCards || undefined,
            new: newDataPayload.creditCards
        });
    }

    return ret;
};
