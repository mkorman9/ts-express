#!/bin/bash

type="${1}";
flag="";

if [[ "${type}" == 'major' ]]; then
  flag="--major";
elif [[ "${type}" == 'minor' ]]; then
  flag="--minor";
elif [[ "${type}" == 'patch' ]]; then
  flag="--patch";
else
  echo "invalid version type: '${type}'" 1>&2;
  exit 1;
fi

last_tag_version=$(git --no-pager tag -l --sort=-v:refname | head -1 | cut -c 2-);
echo "${last_tag_version}" | yarn version --no-git-tag-version

yarn version ${flag}
