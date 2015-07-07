#!/bin/bash

rm -rf node_modules
npm cache clean

rm -f package.json
cp package-info.json package.json

npm install express --save
npm install connect-busboy --save
npm install method-override --save
npm install body-parser --save
npm install morgan --save
npm install q --save
npm install request --save
npm install mongoose@3.8.25 --save
npm install mongoose-q --save
npm install moment --save
npm install sendgrid --save

mkdir client
mkdir client/tickets

