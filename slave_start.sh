#!/bin/bash

APP=$1
PORT=$2

docker run -it -p "$PORT:3000" \
  -v /opt/crypto/cryptocompare/.data:/var/www/app/.data \
  --name "$APP" -d "$APP"
