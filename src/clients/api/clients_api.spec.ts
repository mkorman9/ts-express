import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import moment from 'moment';

import app from '../../app';
import * as clientsProvider from '../providers/clients_provider';
import Client from '../models/client';

chai.use(chaiHttp);

const Records = [{
  id: '1b3f2a11-09a8-4afd-9af0-1ab8b6485e31',
  gender: 'F',
  firstName: 'Amelia',
  lastName: 'Pierce',
  address: 'Queens Road 1482, Bristol, Cambridgeshire ST7 9GA',
  phoneNumber: '0744-910-818',
  email: 'amelia.pierce@example.com',
  birthDate: moment('1982-07-22T20:30:05.000Z'),
  isDeleted: false,
  creditCards: []
}, {
  id: '54616218-3441-4c1d-beac-6297db20a490',
  gender: 'M',
  firstName: 'Daniel',
  lastName: 'Hidalgo',
  address: 'Calle de Bravo Murillo 3158, Guadalajara, Islas Baleares 22000',
  phoneNumber: '640-392-589',
  email: 'daniel.hidalgo@example.com',
  birthDate: null,
  isDeleted: false,
  creditCards: [{
    id: '54bbba06-a6c0-47e2-b026-78d5119abc90',
    number: '4312 3581 4844 5395'
  }]
}] as Client[];

describe('Clients API Tests', () => {
  it('should use default parameters when called for page without parameters', async () => {
    // given
    const clientsPageMock = sinon.stub(clientsProvider, 'findClientsPaged')
      .returns(Promise.resolve({
        rows: Records,
        count: Records.length
      }));

    // when
    const response = await chai.request(app)
      .get('/api/v1/client');

    // then
    expect(clientsPageMock.callCount).equal(1);
    expect(clientsPageMock.lastCall.args).eql([{
      pageNumber: 0,
      pageSize: 10,
      sortBy: 'id',
      sortReverse: false,
      filters: {}
    }]);
    expect(response.status).equal(200);
    expect(response.body.totalPages).equal(1);
    expect(response.body.data).eql(Records.map(r => mapClientModelToResponse(r)));

    clientsPageMock.restore();
  });

  it('should use given parameters when called for page with valid parameters', async () => {
    // given
    const clientsPageMock = sinon.stub(clientsProvider, 'findClientsPaged')
      .returns(Promise.resolve({
        rows: [Records[0]],
        count: 1
      }));

    // when
    const response = await chai.request(app)
      .get('/api/v1/client')
      .query({
        page: 2,
        pageSize: 20,
        sortBy: 'lastName',
        sortReverse: 1,
        'filter[firstName]': 'Daniel'
      });

    // then
    expect(clientsPageMock.callCount).equal(1);
    expect(clientsPageMock.lastCall.args).eql([{
      pageNumber: 2,
      pageSize: 20,
      sortBy: 'lastName',
      sortReverse: true,
      filters: {
        firstName: 'Daniel'
      }
    }]);
    expect(response.status).equal(200);
    expect(response.body.totalPages).equal(1);
    expect(response.body.data).eql([Records[0]].map(r => mapClientModelToResponse(r)));

    clientsPageMock.restore();
  });

  it('should return error when called for page with invalid filter', async () => {
    // when
    const response = await chai.request(app)
      .get('/api/v1/client')
      .query({
        'filter[xxx]': 'yyy'
      });

    // then
    expect(response.status).equal(400);
    expect(response.body.causes).eql([{ field: 'filter', code: 'oneof' }]);
  });

  it('should return error when called for page with invalid sortBy', async () => {
    // when
    const response = await chai.request(app)
      .get('/api/v1/client')
      .query({
        'sortBy': 'xxx'
      });

    // then
    expect(response.status).equal(400);
    expect(response.body.causes).eql([{ field: 'sortBy', code: 'oneof' }]);
  });
});

const mapClientModelToResponse = (model: Client) => {
  return {
    id: model.id,
    gender: model.gender,
    firstName: model.firstName,
    lastName: model.lastName,
    address: model.address,
    phoneNumber: model.phoneNumber,
    email: model.email,
    birthDate: JSON.parse(JSON.stringify(model.birthDate)),
    creditCards: model.creditCards.map(cc => ({
      number: cc.number
    }))
  };
};
