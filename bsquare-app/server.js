"use strict";

import * as Errors from "../shared/lib/Errors";

let https = require("https");
let http = require("http");
let fs = require("fs");
let express = require("express");
let busboy = require("connect-busboy");
let morgan = require("morgan");
let bodyParser = require("body-parser");
let methodOverride = require("method-override");
let mongoose = require("mongoose-q")(require("mongoose"));

let env = require("./env/env");

const settings = env.getSettings();
const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD } = settings;
const dbUrl = 
  `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/bsquare`;
console.log("DB URL: ", dbUrl);
mongoose.connect(dbUrl);

let app = express();

let staticDir = __dirname + "/client";
let modulesDir = __dirname + "/node_modules";
console.log("static file dir: " + staticDir);

app.set("view engine", "html");
app.set("views", staticDir);
app.engine("html", require("ejs").renderFile);

app.db = mongoose;
app.model = require("../bsquare-model")(app.db);

app.settings = settings;
app.sendgrid = require("sendgrid")(settings.SENDGRID_USERNAME, settings.SENDGRID_PASSWORD);
app.mailer = require("../shared/lib/Mailer")(app);

app.phantomService = require("../bsquare-phantom")(app);
app.ticketService = require("../bsquare-tickets")(app);
app.authService = require("../bsquare-auth")(app);

app.trackerService = require("./server/services/trackerService")(app);
app.loginService = require("./server/services/loginService")(app);
app.orderService = require("./server/services/orderService")(app);
app.paymentService = require("./server/services/paymentService")(app);
app.guestService = require("./server/services/guestService")(app);
app.statsService = require("./server/services/statsService")(app);
app.eventService = require("./server/services/eventService")(app);
app.orderUpdates = require('./server/tasks/orderUpdates')(app);

app.use("/", express.static(staticDir));
app.use("/node_modules", express.static(modulesDir));                                  // set the static files location
app.use(bodyParser.urlencoded({ extended: "true" }));               // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                         // parse application/json
app.use(bodyParser.json({ type: "application/vnd.api+json" }));     // parse application/vnd.api+json as json
app.use(methodOverride());										    // simulate DELETE and PUT
app.use(busboy());

require("../shared/lib/Middleware")(app);

require("./server/routes.js")(app);

app.use((err, req, res, next) => {
    
    console.log("Error handler:", err, err.stack);
    
    let response = Object.assign({
        status: err.status,
        message: err.message
    }, err.data ? { error: err.data } : {});

    res.status(err.statusCode || 500);
    res.json(response);


});

var httpServer = http.createServer(app);
var httpPort = process.env.PORT || settings.HTTP_PORT || 8080;
httpServer.listen(httpPort);
console.log("Starting up on port "+httpPort);

/**
 * Run HTTPS server instead of HTTP
 *

if(fs.existsSync(__dirname+'/keys')) {

	var privateKey  = fs.readFileSync(__dirname+'/keys/server-key.pem', 'utf8');
	var certificate = fs.readFileSync(__dirname+'/keys/server-cert.pem', 'utf8');

	var credentials = { key: privateKey, cert: certificate };

	var httpsServer = https.createServer(credentials, app);

	httpsServer.listen(443);
	console.log('Listening on port '+443);

}

***/
