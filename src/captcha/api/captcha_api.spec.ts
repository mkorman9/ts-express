import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import dayjs from 'dayjs';

import app from '../../app';
import {
  DefaultImageWidth,
  DefaultImageHeight,
  DefaultAudioLanguage
} from './captcha_api';
import captchaProvider from '../providers/captcha';
import Captcha from '../models/captcha';

chai.use(chaiHttp);

describe('Captcha API Tests', () => {
  it('should generate new captcha', async () => {
    // given
    const generatedCaptchaId = '76c7ca82-6d5c-428c-8088-147413891f59';
    const generateMock = sinon.stub(captchaProvider, 'generate')
      .returns(Promise.resolve({
        id: generatedCaptchaId,
        code: '000000',
        createdAt: dayjs().toDate(),
        expiresAt: dayjs().add(30, 'minutes').toDate()
      } as Captcha));

    // when
    const response = await chai.request(app)
      .get('/api/v1/captcha/generate');

    // then
    generateMock.restore();
    expect(generateMock.callCount).equal(1);

    expect(response.status).equal(200);
    expect(response.body).eql({
      id: generatedCaptchaId
    });
  });

  it('should return image for existing captcha', async () => {
    // given
    const captchaId = '76c7ca82-6d5c-428c-8088-147413891f59';
    const imageData = Buffer.of(1, 2, 3, 4);
    const getImageMock = sinon.stub(captchaProvider, 'getImage')
      .returns(Promise.resolve(imageData));

    // when
    const response = await chai.request(app)
      .get(`/api/v1/captcha/image/${captchaId}`);

    // then
    getImageMock.restore();
    expect(getImageMock.callCount).equal(1);
    expect(getImageMock.lastCall.args).eql([captchaId, { width: DefaultImageWidth, height: DefaultImageHeight }]);

    expect(response.status).equal(200);
    expect(response.body).eql(imageData);
  });

  it('should return 404 for non-existing captcha image', async () => {
    // given
    const captchaId = '76c7ca82-6d5c-428c-8088-147413891f59';
    const getImageMock = sinon.stub(captchaProvider, 'getImage')
      .returns(Promise.resolve(null));

    // when
    const response = await chai.request(app)
      .get(`/api/v1/captcha/image/${captchaId}`);

    // then
    getImageMock.restore();
    expect(getImageMock.callCount).equal(1);
    expect(getImageMock.lastCall.args).eql([captchaId, { width: DefaultImageWidth, height: DefaultImageHeight }]);

    expect(response.status).equal(404);
  });

  it('should return audio for existing captcha', async () => {
    // given
    const captchaId = '76c7ca82-6d5c-428c-8088-147413891f59';
    const audioData = Buffer.of(1, 2, 3, 4);
    const getAudioMock = sinon.stub(captchaProvider, 'getAudio')
      .returns(Promise.resolve(audioData));

    // when
    const response = await chai.request(app)
      .get(`/api/v1/captcha/audio/${captchaId}`);

    // then
    getAudioMock.restore();
    expect(getAudioMock.callCount).equal(1);
    expect(getAudioMock.lastCall.args).eql([captchaId, { language: DefaultAudioLanguage }]);

    expect(response.status).equal(200);
    // expect(response.body).eql(audioData);
  });

  it('should return 404 for non-existing captcha audio', async () => {
    // given
    const captchaId = '76c7ca82-6d5c-428c-8088-147413891f59';
    const getAudioMock = sinon.stub(captchaProvider, 'getAudio')
      .returns(Promise.resolve(null));

    // when
    const response = await chai.request(app)
      .get(`/api/v1/captcha/audio/${captchaId}`);

    // then
    getAudioMock.restore();
    expect(getAudioMock.callCount).equal(1);
    expect(getAudioMock.lastCall.args).eql([captchaId, { language: DefaultAudioLanguage }]);

    expect(response.status).equal(404);
  });
});
