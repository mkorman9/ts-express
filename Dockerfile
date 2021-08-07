FROM node:16.3.0

RUN adduser --disabled-password --gecos "" --shell /bin/false --home /app app && \
    rm -rf /app/* && \
    chown -R app:app /app

ADD dist/ /app/dist
ADD package.json /app
ADD yarn.lock /app
ADD LICENSE.txt /app

WORKDIR /app
USER app

RUN yarn install --production

ENV TZ UTC
ENV NODE_ENV production

CMD exec node ./dist
