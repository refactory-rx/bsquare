#!/bin/bash
echo Stopping app
forever stop bsquare-app
echo Pulling latest from master
git pull
echo Waiting 8 secs and restarting
sleep 8
npm run babel && npm run forever
