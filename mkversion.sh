#!/bin/bash
gitdate=$(git log -1 --format=%cd --date=iso)
builddate=$(date --rfc-3339=seconds)
lastcommit=$(git log -1 --format=%H)
version=$(git rev-list --count HEAD)
echo "{ \"date\": \"$gitdate\", \"builddate\": \"$builddate\",  \"commit\": \"$lastcommit\", \"version\": \"$version\" }" > version.json
