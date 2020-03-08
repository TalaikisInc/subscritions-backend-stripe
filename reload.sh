#!/bin/bash

APP=blue-sub-backend
PORT=3012

./slave_build.sh "$APP"
docker stop "$APP"
docker rm "$APP"
./slave_start.sh "$APP" "$PORT"
