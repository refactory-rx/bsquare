#!/bin/bash
forever stop bsquare-app
git pull
npm run babel && npm run forever
