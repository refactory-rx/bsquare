import url from "url";

module.exports = {

    init: (app) => {

        let { isLoggedIn } = require("../../../shared/lib/RouteFilters")(app);
        
        app.get("/some/url", isLoggedIn, (req, res, next) => {   
            res.json({ status: "ok" });
        });
        
        app.get("/another/url", (req, res, next) => {   
            res.json({ status: "ok" });
        });
        
        app.get("/api/events", (req, res, next) => {
            
            let params = {};
            
            if (req.query.q) {
                
                app.eventService.searchEventsByText(q, (response) => {
                    res.json(response);
                });
                
                return;

            }
            
            if (req.query.kind === "own" && req.auth) {
                params.user = req.auth.user.id;
            } else {
			    params["info.timeEnd"] = {
				    $gt: (new Date()).getTime()
			    };
            }
            
            console.log(params, req.auth);
            app.eventService.getEvents(params)
            .then((events) => {
                
                let response = { status: "ok", events: events };
                
                if (params.user) {
                    response.myEventsTemplate = "parts/app/myEvents_blocked.html";
                    if (req.auth.user.email === "vhalme@gmail.com") {
                        response.myEventsTemplate = "parts/app/myEvents_private.html";
                    }
                }
                
                res.json(response);
            
            })
            .catch((err) => {
                next(err);
            });

		});

        app.get("/api/events/promo", (req, res, next) => {
            app.eventService.getPromoEvents()
            .then((events) => {
                res.json({ status: "ok", events: events });
            })
            .catch((err) => {
                next(err);
            });
        });

        app.get("/api/events/:id", (req, res, next) => {

            let params = req.query;

            params._id = req.params.id;

            params.tracking = {
                fwd: req.headers["x-forwarded-for"],
                remoteIp: req.connection.remoteAddress
            };

            if (params.group) {
                params.tracking.group = params.group;
                delete params.group;
            }
            if (params.ref) {
                params.tracking.ref = params.ref;
                delete params.ref;
            }

            if(req.auth) {
                Object.assign(params.tracking, {
                    token: req.headers['session-token'],
                    user: req.auth.user
                });
            }

            app.eventService.getEvent(params, (result) => {
                res.json(result);
            });

        });
        
		app.post('/api/events', isLoggedIn, (req, res, next) => {
            app.eventService.saveEvent(req, (result) => {
                res.json(result);
            });
		});

		app.get('/api/ticketresources/:eventId', (req, res, next) => {
            app.eventService.getTicketResources(req, (result) => {
                res.json(result);
            });
        });

		app.post('/api/ticketresources', isLoggedIn, (req, res, next) => {
            app.eventService.saveTicketResource(req, (result) => {
                res.json(result);
		    });
		});

		app.delete('/api/ticketresources/:id', isLoggedIn, (req, res, next) => {
            app.eventService.deleteTicketResource(req.params.id)
            .then((response) => {
                res.json(response);
            })
        });

		app.post('/api/bundleproduct', isLoggedIn, (req, res, next) => {
            app.eventService.bundleProduct(req, (result) => {
                res.json(result);
            });
        });

		app.post('/api/uploads/:id/file', isLoggedIn, (req, res, next) => {
            app.eventService.saveFile(req, (result) => {
                res.json(result);
            });
        });

	}

}
