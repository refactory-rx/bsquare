#!/bin/bash
echo Pulling latest from master
git pull
echo Reinstall npm
npm install
echo Reinstall bower
bower install
# echo Reinstall tsd
# tsd install
echo Transpiling ES6 client code
grunt babel concat ngAnnotate uglify:server
echo Restarting server
pkill -f "bsquare-app/server.js"
