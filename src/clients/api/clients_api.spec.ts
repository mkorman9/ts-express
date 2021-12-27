import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import moment from 'moment';

import app from '../../app';
import * as authProvider from '../../session/middlewares/authorization';
import * as clientsProvider from '../providers/clients';
import Client from '../models/client';
import { SessionContext } from '../../session/providers/session';
import Account from '../../accounts/models/account';

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
    id: '1efb2901-6f1b-4a1f-8ceb-e59d3d7db197',
    number: '4312 3581 4844 5395'
  }]
}] as Client[];

const InsertedRecord = {
  id: 'c9720047-b769-4345-9c60-a94339f46e08',
  gender: '-',
  firstName: 'Jane',
  lastName: 'Doe',
  address: '',
  phoneNumber: '',
  email: '',
  birthDate: null,
  isDeleted: false,
  creditCards: []
} as Client;

const TestSessionContext = {
  id: 'c3373b3f-e49c-40ce-b694-3c3801220165',
  issuedAt: moment(),
  expiresAt: moment().add(1, 'hour'),
  duration: 3600,
  issuer: '',
  subject: 'testuser',
  ip: '127.0.0.1',
  roles: new Set<string>(['CLIENTS_EDITOR']),
  resources: null,
  raw: 'c9cf6558-d8df-42cf-9099-81273fd76550'
} as SessionContext;

const TestSessionAccount = {
  id: 'e9fa80e1-d978-4430-8f44-904f741e13d0',
  username: 'testuser',
  rolesString: 'CLIENTS_EDITOR',
  isActive: true,
  isDeleted: false,
  bannedUntil: null,
  language: 'en-US',
  passwordCredentials: null,
  githubCredentials: null
} as Account;

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

  it('should find existing client by id when queried', async () => {
    // given
    const clientByIdMock = sinon.stub(clientsProvider, 'findClientById')
      .returns(Promise.resolve(Records[0]));

    // when
    const response = await chai.request(app)
      .get(`/api/v1/client/${Records[0].id}`);

    // then
    expect(clientByIdMock.callCount).equal(1);
    expect(clientByIdMock.lastCall.args).eql([
      Records[0].id
    ]);
    expect(response.status).equal(200);
    expect(response.body).eql(mapClientModelToResponse(Records[0]));

    clientByIdMock.restore();
  });

  it('should return error when queried for non-existing client id', async () => {
    // given
    const clientId = '894e1357-9f6f-4a2b-9871-4f38dd812a99';
    const clientByIdMock = sinon.stub(clientsProvider, 'findClientById')
      .returns(Promise.resolve(null));

    // when
    const response = await chai.request(app)
      .get(`/api/v1/client/${clientId}`);

    // then
    expect(clientByIdMock.callCount).equal(1);
    expect(clientByIdMock.lastCall.args).eql([
      clientId
    ]);
    expect(response.status).equal(404);

    clientByIdMock.restore();
  });

  it('should return error when trying to add client without valid session', async () => {
    // given
    const payload = {
      firstName: 'Jane',
      lastName: 'Doe'
    };

    // when
    const response = await chai.request(app)
      .post('/api/v1/client')
      .type('application/json')
      .send(payload);

    // then
    expect(response.status).equal(401);
  });

  it('should add new client when endpoint called with valid payload', async () => {
    // given
    const payload = {
      firstName: 'Jane',
      lastName: 'Doe'
    };

    const getSessionContextMock = sinon.stub(authProvider, 'getSessionContext')
      .returns(TestSessionContext);
    const getSessionAccountMock = sinon.stub(authProvider, 'getSessionAccount')
      .returns(TestSessionAccount);
    const addClientMock = sinon.stub(clientsProvider, 'addClient')
      .returns(Promise.resolve(InsertedRecord));

    // when
    const response = await chai.request(app)
      .post('/api/v1/client')
      .type('application/json')
      .send(payload);

    // then
    expect(addClientMock.callCount).equal(1);
    expect(addClientMock.lastCall.args).eql([{
      gender: undefined,
      firstName: payload.firstName,
      lastName: payload.lastName,
      address: undefined,
      phoneNumber: undefined,
      email: undefined,
      birthDate: undefined,
      creditCards: []
    }, {
      author: TestSessionAccount.id
    }]);
    expect(response.status).equal(200);
    expect(response.body.id).equal(InsertedRecord.id);

    getSessionContextMock.restore();
    getSessionAccountMock.restore();
    addClientMock.restore();
  });

  it('should return error when trying to add client with invalid gender', async () => {
    // given
    const payload = {
      gender: 'X',
      firstName: 'Jane',
      lastName: 'Doe'
    };

    const getSessionContextMock = sinon.stub(authProvider, 'getSessionContext')
      .returns(TestSessionContext);
    const getSessionAccountMock = sinon.stub(authProvider, 'getSessionAccount')
      .returns(TestSessionAccount);

    // when
    const response = await chai.request(app)
      .post('/api/v1/client')
      .type('application/json')
      .send(payload);

    // then
    expect(response.status).equal(400);
    expect(response.body.causes).eql([{ field: 'gender', code: 'oneof' }]);

    getSessionContextMock.restore();
    getSessionAccountMock.restore();
  });

  it('should return error when trying to add client without firstName', async () => {
    // given
    const payload = {
      lastName: 'Doe'
    };

    const getSessionContextMock = sinon.stub(authProvider, 'getSessionContext')
      .returns(TestSessionContext);
    const getSessionAccountMock = sinon.stub(authProvider, 'getSessionAccount')
      .returns(TestSessionAccount);

    // when
    const response = await chai.request(app)
      .post('/api/v1/client')
      .type('application/json')
      .send(payload);

    // then
    expect(response.status).equal(400);
    expect(response.body.causes).eql([{ field: 'firstName', code: 'required' }]);

    getSessionContextMock.restore();
    getSessionAccountMock.restore();
  });

  it('should return error when trying to add client without lastName', async () => {
    // given
    const payload = {
      firstName: 'Jane'
    };

    const getSessionContextMock = sinon.stub(authProvider, 'getSessionContext')
      .returns(TestSessionContext);
    const getSessionAccountMock = sinon.stub(authProvider, 'getSessionAccount')
      .returns(TestSessionAccount);

    // when
    const response = await chai.request(app)
      .post('/api/v1/client')
      .type('application/json')
      .send(payload);

    // then
    expect(response.status).equal(400);
    expect(response.body.causes).eql([{ field: 'lastName', code: 'required' }]);

    getSessionContextMock.restore();
    getSessionAccountMock.restore();
  });

  it('should return error when trying to add client with invalid birth date', async () => {
    // given
    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      birthDate: 'XXX'
    };

    const getSessionContextMock = sinon.stub(authProvider, 'getSessionContext')
      .returns(TestSessionContext);
    const getSessionAccountMock = sinon.stub(authProvider, 'getSessionAccount')
      .returns(TestSessionAccount);

    // when
    const response = await chai.request(app)
      .post('/api/v1/client')
      .type('application/json')
      .send(payload);

    // then
    expect(response.status).equal(400);
    expect(response.body.causes).eql([{ field: 'birthDate', code: 'format' }]);

    getSessionContextMock.restore();
    getSessionAccountMock.restore();
  });

  it('should return error when trying to add client with invalid credit card number', async () => {
    // given
    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      creditCards: [{
        number: 'XXXX XXX'
      }]
    };

    const getSessionContextMock = sinon.stub(authProvider, 'getSessionContext')
      .returns(TestSessionContext);
    const getSessionAccountMock = sinon.stub(authProvider, 'getSessionAccount')
      .returns(TestSessionAccount);

    // when
    const response = await chai.request(app)
      .post('/api/v1/client')
      .type('application/json')
      .send(payload);

    // then
    expect(response.status).equal(400);
    expect(response.body.causes).eql([{ field: 'creditCards[0].number', code: 'ccnumber' }]);

    getSessionContextMock.restore();
    getSessionAccountMock.restore();
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
