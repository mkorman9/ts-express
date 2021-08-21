import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';

import app from './app';

chai.use(chaiHttp);

describe('Generic API Tests', () => {
  it('healthcheck should pass', async () => {
    // when
    const response = await chai.request(app)
      .get('/health');

    // then
    expect(response.status).equal(200);
    expect(response.body.status).equal('healthy');
  });
});
