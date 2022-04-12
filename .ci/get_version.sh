#!/bin/bash

if [[ "${CI_COMMIT_TAG}" != '' ]]; then
  echo "$(echo "${CI_COMMIT_TAG}" | | cut -c 2-)";
elif [[ "${CI_COMMIT_BRANCH}" != '' ]]; then
  echo "$(git --no-pager tag -l --sort=v:refname | head -1 | cut -c 2-)-${CI_COMMIT_BRANCH}";
else
  echo "0.0.1-dev";
fi
