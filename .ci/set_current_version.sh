#!/bin/bash

.ci/get_version.sh | yarn version --no-git-tag-version
