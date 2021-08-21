# ts-express

## Overview

ts-express is just my personal playground to play with Typescript and Express.js

## Running locally

### Run the dependencies

```sh
docker-compose up
```

This will start Postgres and Redis using docker-compose stack. It will also initialize the database schema and upload some basic data for testing.
Keep in mind the state of the database and redis will be held between consequitve `docker-compose up`. To reset the state run:

```sh
docker-compose down && rm -rf _docker_compose_volumes
```

### Run the app

The app uses yarn to keep track of the external dependencies. When running for the first time remember to execute:

```sh
yarn install
```

Then each time when you want to start the app, simply run:

```sh
yarn start
```
