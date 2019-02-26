#!/bin/bash

rm -rf dist
mkdir -p dist
cp -r static/* dist
echo "window.basiqConfig = " > dist/config.js
build/read-environment.sh >> dist/config.js
