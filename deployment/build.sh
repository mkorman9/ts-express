#!/bin/bash

SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

cd $SCRIPTPATH/..

yarn build
docker build -t mkorman/ts-express .

cd frontend

yarn build
docker build -t mkorman/ts-express-frontend .
