FROM node:16.14.2-alpine

RUN mkdir /app

ADD dist/ /app/dist
ADD package.json /app
ADD yarn.lock /app
ADD LICENSE.txt /app

WORKDIR /app

RUN yarn install --production && \
    yarn cache clean

ENV NODE_ENV production
CMD ["yarn", "serve"]
