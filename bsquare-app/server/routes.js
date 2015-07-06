import mongoose from "mongoose";
import url from "url";

module.exports = function(app) {

    let Event = app.model.Event;
    
    app.loginService.start();
    app.orderUpdates.start();

    app.eventService.initRoutes();
    app.loginService.initRoutes();
    app.orderService.initRoutes();
    app.paymentService.initRoutes();
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

    app.get('*', (req, res) => {
		res.sendFile(__dirname+'/client/index.html'); // load the single view file (angular will handle the page changes on the front-end)
	});


};
