FROM node:16.14.2-bullseye-slim

RUN addgroup --gid 9000 app && \
    adduser --disabled-password --gecos "" --shell /bin/false --home /app --uid 9000 --gid 9000 app && \
    find /app -mindepth 1 -delete

ADD dist/ /app/dist
ADD package.json /app
ADD yarn.lock /app
ADD LICENSE.txt /app
RUN chown -R app:app /app

WORKDIR /app
USER app

RUN yarn install --production && \
    yarn cache clean
RUN yarn version --non-interactive | grep 'Current version:' | awk '{print $4}' | tr -d '\n' > .version

ENV NODE_ENV production
CMD exec node --enable-source-maps ./dist
