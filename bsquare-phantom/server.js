"use strict";

require("./env/env");

import log4js from "log4js";
let log = log4js.getLogger("PhantomServer");

import https from "https";
import http from "http";
import fs from "fs";
import express from "express";
import busboy from "connect-busboy";
import morgan from "morgan";
import bodyParser from "body-parser";
import methodOverride from "method-override";

let app = express();
app.use(express.static(`${__dirname}/client`));
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ "extended": "true" }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));
app.use(methodOverride());
app.use(busboy());

app.phantomService = require("./api/phantomService")(app)
require("./server/phantomServiceRoutes").init(app);

let httpServer = http.createServer(app);
let httpPort = process.env.PORT || 8080;

httpServer.listen(httpPort);
log.info(`Listening on port ${httpPort}`);

/**
 * Run HTTPS server instead of HTTP
 *

if(fs.existsSync(__dirname+'/keys')) {

	let privateKey  = fs.readFileSync(__dirname+'/keys/server-key.pem', 'utf8');
	let certificate = fs.readFileSync(__dirname+'/keys/server-cert.pem', 'utf8');

	let credentials = { key: privateKey, cert: certificate };

	let httpsServer = https.createServer(credentials, app);

	httpsServer.listen(443);
	console.log('Listening on port '+443);

}

***/

