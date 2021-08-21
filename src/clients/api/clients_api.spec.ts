import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import moment from 'moment';

import app from '../../app';
import * as clientsProvider from '../providers/clients_provider';
import Client from '../models/client';

chai.use(chaiHttp);

describe('Clients API Tests', () => {
  it('call for page with default parameters should return existing records', async () => {
    // given
    const records = [{
      id: '1b3f2a11-09a8-4afd-9af0-1ab8b6485e31',
      gender: 'F',
      firstName: 'Amelia',
      lastName: 'Pierce',
      address: 'Queens Road 1482, Bristol, Cambridgeshire ST7 9GA',
      phoneNumber: '0744-910-818',
      email: 'amelia.pierce@example.com',
      birthDate: moment('1982-07-22T20:30:05.000Z'),
      isDeleted: false,
      creditCards: [{
        id: '54bbba06-a6c0-47e2-b026-78d5119abc90',
        number: '0000 0000 0000 0000'
      }]
    }] as Client[];

    const clientsPageMock = sinon.stub(clientsProvider, 'findClientsPaged')
      .returns(Promise.resolve({
        rows: records,
        count: records.length
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
    expect(response.body.data).eql(records.map(r => mapClientModelToResponse(r)));

    clientsPageMock.reset();
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
