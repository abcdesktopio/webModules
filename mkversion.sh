#!/bin/bash
builddate=$(git log -1 --format=%cd --date=iso)
# builddate=$(git log -1 --format=%cd)
lastcommit=$(git log -1 --format=%H)
version=$(git rev-list --count HEAD)
echo "{ \"date\": \"$builddate\", \"commit\": \"$lastcommit\", \"version\": \"$version\" }" > version.json
