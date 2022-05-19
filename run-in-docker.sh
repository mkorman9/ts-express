#!/bin/bash

yarn build
docker build -t mkorman/ts-express .
docker run -it --rm -p 8080:8080 -v $(pwd)/config-docker.yml:/app/config.yml:ro --net ts-express_default mkorman/ts-express
