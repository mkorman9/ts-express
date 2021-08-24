import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';

import app from './app';

chai.use(chaiHttp);

describe('Generic API Tests', () => {
  it('should be healthy', async () => {
    // when
    const response = await chai.request(app)
      .get('/health');

    // then
    expect(response.status).equal(200);
    expect(response.type).equal('application/json');
    expect(response.body.status).equal('healthy');
  });

  it('should return metrics', async () => {
    // when
    const response = await chai.request(app)
      .get('/metrics');

    // then
    expect(response.status).equal(200);
    expect(response.type).equal('text/plain');
    expect(response.text.length).greaterThan(0);
  });
});
