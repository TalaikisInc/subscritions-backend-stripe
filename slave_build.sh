
#!/bin/bash

APP=$1

docker build --no-cache -t "$APP" .
