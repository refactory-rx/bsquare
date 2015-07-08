var env = require('./env/env');

var https = require('https');
var http = require('http');
var fs = require('fs');
var express = require('express');
var busboy = require('connect-busboy');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
let mongoose = require('mongoose-q')(require('mongoose'));

var settings = env.getSettings();
console.log("DB URL: ", settings.DATABASE_URL);
mongoose.connect(settings.DATABASE_URL);

var app = express();
app.db = mongoose;
app.model = require("../bsquare-model")(app.db);

app.settings = settings;

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

app.use(express.static(__dirname + '/client')); 				// set the static files location
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());										// simulate DELETE and PUT
app.use(busboy());

app.use(function errorHandler(err, req, res, next) {
    console.log("Error handler launched", err);
    res.json(err);
});

require('./server/routes.js')(app);

var httpServer = http.createServer(app);
var httpPort = process.env.PORT || 8080;

httpServer.listen(httpPort);
console.log('Listening on port '+httpPort);

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
