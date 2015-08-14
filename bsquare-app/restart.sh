#!/bin/bash
echo Pulling latest from master
git pull
echo Transpiling ES6 client code
grunt babel concat ng-annotate uglify
echo Restarting server
pkill -f "bsquare-app/server.js"
