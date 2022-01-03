FROM node:16.3.0

RUN addgroup --gid 9000 app && \
    adduser --disabled-password --gecos "" --shell /bin/false --home /app --uid 9000 --gid 9000 app && \
    find /app -mindepth 1 -delete

ADD dist/ /app/dist
ADD templates/ /app/templates
ADD package.json /app
ADD yarn.lock /app
ADD LICENSE.txt /app
RUN chown -R app:app /app

WORKDIR /app
USER app

RUN yarn install --production && \
    yarn cache clean

ENV NODE_ENV production
CMD exec node --enable-source-maps ./dist
