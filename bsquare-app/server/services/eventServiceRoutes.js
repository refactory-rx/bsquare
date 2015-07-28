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
                
                app.eventService.searchEventsByText(req.query.q)
                .then((events) => {
                    res.json({ status: "ok", events: events });
                })
                .catch((err) => {
                    next(err);
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
        
        app.get("/api/events/stats", (req, res, next) => {
            app.eventService.getEventStats()
            .then((eventStats) => {
                res.json({ status: "ok", eventStats: eventStats });
            })
            .catch((err) => {
                next(err);
            });
        });

        app.get("/api/events/:id", (req, res, next) => {
            
            let tracking = Object.assign({ 
                fwd: req.headers["x-forwarded-for"],
                remoteIp: req.connection.remoteAddress
            }, req.query, req.auth ? {
                token: req.headers["session-token"],
                user: req.auth.user
            } : {});

            app.eventService.getEvent(req.params.id)
            .then((event) => {
                app.eventService.updateImpressions(event._id, tracking);
                res.json(Object.assign(
                    { status: "ok", event: event },
                    req.auth && event.user.equals(req.auth.user.id) ? { ownEvent: "true" } : {}
                ));
            })
            .catch((err) => {
                next(err);
            });

        });
        
		app.post("/api/events", isLoggedIn, (req, res, next) => {
            
            app.eventService.createEvent(req.body, req.auth.user)
            .then((event) => {
                res.json({ status: "ok", event: event });
            })
            .catch((err) => {
                next(err);
            });

		});
        
        app.put("/api/events", isLoggedIn, (req, res, next) => {
            
            app.eventService.updateEvent(req.body)
            .then((event) => {
                res.json({ status: "ok", event: event });
            })
            .catch((err) => {
                next(err);
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
