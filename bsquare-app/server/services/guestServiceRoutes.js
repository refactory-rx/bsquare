import url from "url";

module.exports = {

    init: (app) => {
		
        let { isLoggedIn } = require("../../../shared/lib/RouteFilters")(app);
        
        app.get("/api/events/:id/guests", isLoggedIn, (req, res, next) => {
			
            if(req.query.q) {
                app.guestService.getGuests(req.params.id, req.query.q)
                .then((response) => {
                    res.json(response);
                });
            } else {
                app.guestService.getGuests(req.params.id)
                .then((response) => {
                    res.json(response);
                });	
            }
			
		});
			
        app.post("/api/events/:id/messages", isLoggedIn, (req, res, next) => {
			
			let message = Object.assign(req.body, { eventId: req.params.id });
			
            app.guestService.sendMessage(message)
            .then(() => {
                res.json({ status: "ok" });
            })
            .catch((err) => {
                next(err);
            });            
			
		});
		
        app.get("/api/events/:id/messages", (req, res, next) => {
			
            app.authService.screenRequest(req, true, (result) => {
					
				app.guestService.getMessages(req.params.id)
                .then((response) => {
					res.json(response);
				});
			
			});
			
		});
		
	}

};
