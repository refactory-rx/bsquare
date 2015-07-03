import url from "url";

module.exports = {

    init: (app) => {

        app.get("/api/events", (req, res) => {

		    let url_parts = url.parse(req.url, true);
		    let params = url_parts.query;

            app.authService.screenRequest(req, true, (result) => {

                if (result.status === "authorized") {
                    params.user = result.user;
                }

                app.eventService.getEvents(params, (result) => {
				    res.json(result);
                });

            });

		});

        app.get("/api/events/:id", (req, res) => {

            let url_parts = url.parse(req.url, true);
		    let params = url_parts.query;

            if(req.params.id === "promo") {

                app.eventService.getPromoEvents(params, (result) => {
					res.json(result);
                });

			} else {

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

                app.authService.screenRequest(req, true, (result) => {

				    if(result.status == 'authorized') {
                        Object.assign(params.tracking, {
                            token: req.headers['session-token'],
					        user: result.user
                        });
                    }

                    app.eventService.getEvent(params, (result) => {
                        res.json(result);
                    });

                });

			}

        });

		app.post('/api/events', (req, res) => {
            app.eventService.saveEvent(req, (result) => {
                res.json(result);
            });
		});

		app.get('/api/ticketresources/:eventId', (req, res) => {
            app.eventService.getTicketResources(req, function(result) {
                res.json(result);
            });
        });

		app.post('/api/ticketresources', (req, res) => {
            app.eventService.saveTicketResource(req, (result) => {
                res.json(result);
		    });
		});

		app.delete('/api/ticketresources/:id', (req, res) => {
            app.authService.screenRequest(req, true, (result) => {
                if(result.status == 'authorized') {
                    app.eventService.deleteTicketResource(req.params.id)
                    .then((response) => {
                        res.json(response);
                    })
                } else {
                    res.json(result);
                }
            });
        });

		app.post('/api/bundleproduct', (req, res) => {
            app.eventService.bundleProduct(req, (result) => {
                res.json(result);
            });
        });

		app.post('/api/uploads/:id/file', (req, res) => {
            app.eventService.saveFile(req, (result) => {
                res.json(result);
            });
        });

	}

}
