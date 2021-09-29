import { FC, useState, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FormGroup, Label, Input, Form } from 'reactstrap';
import type { Moment } from 'moment';

import DateSelector from '../common/DateSelector';

export interface ClientsFilterRef<T> {
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
}

export interface ClientsFiltersRef {
  gender: ClientsFilterRef<string>;
  firstName: ClientsFilterRef<string>;
  lastName: ClientsFilterRef<string>;
  address: ClientsFilterRef<string>;
  phoneNumber: ClientsFilterRef<string>;
  email: ClientsFilterRef<string>;
  creditCard: ClientsFilterRef<string>;
  bornAfter: ClientsFilterRef<Moment | null>;
  bornBefore: ClientsFilterRef<Moment | null>;
}

export interface ClientsTableFiltersProps {
  setCurrentPage: Dispatch<SetStateAction<number>>;
  filters: ClientsFiltersRef;
  clearFilters: () => void;
}

const ClientsTableFilters: FC<ClientsTableFiltersProps> = ({ setCurrentPage, filters, clearFilters }) => {
  const { t } = useTranslation();
  const [isFolded, setIsFolded] = useState<boolean>(() => true);

  function handleFilterChange<T>(filter: ClientsFilterRef<T>, value: T) {
    filter.setValue(value);
    setCurrentPage(0);
  }

  const countActiveFilters = (): number => {
    let v = 0;

    if (filters.gender.value) {
      v++;
    }
    if (filters.firstName.value) {
      v++;
    }
    if (filters.lastName.value) {
      v++;
    }
    if (filters.address.value) {
      v++;
    }
    if (filters.phoneNumber.value) {
      v++;
    }
    if (filters.email.value) {
      v++;
    }
    if (filters.bornAfter.value) {
      v++;
    }
    if (filters.bornBefore.value) {
      v++;
    }
    if (filters.creditCard.value) {
      v++;
    }

    return v;
  };

  return (
    <Form className="mt-4 mb-4 p-3 border">
      <div className="row">
        <div className="col">
          <div className="float-left">
            <span onClick={() => setIsFolded(!isFolded)}>{(isFolded ? 'ᐅ ' : '▼ ') + t('table.filters.activeFilters', { number: countActiveFilters() })}</span>
          </div>
          {countActiveFilters() > 0 && (<>
            <div className="float-right">
              <Button color="link" onClick={() => clearFilters()} className="mt-0 pt-0">{t('table.filters.clearFilters')}</Button>
            </div>
          </>)}
          <div className="clearfix"></div>
        </div>
      </div>
      {!isFolded && (<>
        <div className="row">
          <div className="col">
            <FormGroup>
              <Label for="gender">{t('table.filters.gender')}</Label>
              <Input type="select" name="gender" id="gender"
                value={filters.gender.value}
                onChange={e => handleFilterChange<string>(filters.gender, e.target.value)}
              >
                <option value=""></option>
                <option value="M">{t('table.filters.genders.M')}</option>
                <option value="F">{t('table.filters.genders.F')}</option>
                <option value="-">{t('table.filters.genders.NA')}</option>
              </Input>
            </FormGroup>
          </div>
          <div className="col">
            <FormGroup>
              <Label for="firstName">{t('table.filters.firstName')}</Label>
              <Input type="text" name="firstName" id="firstName"
                value={filters.firstName.value}
                onChange={e => handleFilterChange<string>(filters.firstName, e.target.value)}
              />
            </FormGroup>
          </div>
          <div className="col">
            <FormGroup>
              <Label for="lastName">{t('table.filters.lastName')}</Label>
              <Input type="text" name="lastName" id="lastName"
                value={filters.lastName.value}
                onChange={e => handleFilterChange<string>(filters.lastName, e.target.value)}
              />
            </FormGroup>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <FormGroup>
              <Label for="address">{t('table.filters.address')}</Label>
              <Input type="text" name="address" id="address"
                value={filters.address.value}
                onChange={e => handleFilterChange<string>(filters.address, e.target.value)}
              />
            </FormGroup>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <FormGroup>
              <Label for="phoneNumber">{t('table.filters.phoneNumber')}</Label>
              <Input type="text" name="phoneNumber" id="phoneNumber"
                value={filters.phoneNumber.value}
                onChange={e => handleFilterChange<string>(filters.phoneNumber, e.target.value)}
              />
            </FormGroup>
          </div>
          <div className="col">
            <FormGroup>
              <Label for="email">{t('table.filters.email')}</Label>
              <Input type="text" name="email" id="email"
                value={filters.email.value}
                onChange={e => handleFilterChange<string>(filters.email, e.target.value)}
              />
            </FormGroup>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <FormGroup>
              <Label for="bornAfter">{t('table.filters.bornAfter')}</Label>
              <DateSelector id="bornAfter" value={filters.bornAfter.value} onChange={v => handleFilterChange<Moment | null>(filters.bornAfter, v)} />
            </FormGroup>
          </div>
          <div className="col">
            <FormGroup>
              <Label for="bornBefore">{t('table.filters.bornBefore')}</Label>
              <DateSelector id="bornBefore" value={filters.bornBefore.value} onChange={v => handleFilterChange<Moment | null>(filters.bornBefore, v)} />
            </FormGroup>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <FormGroup>
              <Label for="creditCard">{t('table.filters.creditCardNumber')}</Label>
              <Input type="text" name="creditCard" id="creditCard"
                value={filters.creditCard.value}
                onChange={e => handleFilterChange<string>(filters.creditCard, e.target.value)}
              />
            </FormGroup>
          </div>
        </div>
      </>)}
    </Form>
  );
};

export default ClientsTableFilters;
