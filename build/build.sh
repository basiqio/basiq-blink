#!/bin/bash

rm -rf dist
mkdir -p dist

cp -r static/fonts dist
cp -r static/js dist
cp -r static/js/polyfills dist
cp static/fortress.svg dist
cp static/index.html dist
cp static/institution.svg dist
cp static/style.css dist
cp static/js/helpers.js dist
cp static/js/API.js dist