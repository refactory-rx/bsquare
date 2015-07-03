var mongoose = require('mongoose');
var url = require('url');

var restUtil = require('./utils/restUtil');

let eventServiceRoutes = require('./services/eventServiceRoutes');
let loginServiceRoutes = require('./services/loginServiceRoutes');
let orderServiceRoutes = require('./services/orderServiceRoutes');
let paymentServiceRoutes = require('./services/paymentServiceRoutes');

module.exports = function(app) {

    var User = app.model.User;
    var Event = app.model.Event;
    
    app.loginService.start();
    app.orderUpdates.start();

    eventServiceRoutes.init(app);
    loginServiceRoutes.init(app);
    orderServiceRoutes.init(app);
    paymentServiceRoutes.init(app);

	app.trackerService.initRoutes();
	app.statsService.initRoutes();
    app.guestService.initRoutes();
    app.ticketService.initRoutes();

    app.get('/e/:slug', function(req, res) {
        Event.findOne({ slug: req.params.slug }, function(err, event) {
            if(!err || event) {
                res.redirect('/#/event/'+event._id);
            } else {
                res.redirect('/404.html');
            }

        });
    });

	app.get('/api/users/:id', function(req, res) {
		restUtil.getOne(User, req, res);
	});

    app.get('/api/users', function(req, res) {
    	restUtil.getMany(User, req, res);
    });

	app.post('/api/users/:id', function(req, res) {
		restUtil.post(User, req, res);
	});

	app.delete('/api/users/:id', function(req, res) {
		restUtil.delete(User, req, res);
	});

	app.get('*', function(req, res) {
		res.sendFile(__dirname+'/public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
	});


};
