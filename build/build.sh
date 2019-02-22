#!/bin/bash

rm -rf dist
mkdir -p dist
mkdir -p dist/images

cp -r static/fonts dist
cp -r static/js dist
cp -r static/js/polyfills dist
cp static/images/fortress.svg dist/images
cp static/index.html dist
cp static/images/institution.svg dist/images
cp static/style.css dist
cp static/js/helpers.js dist
cp static/js/API.js dist
