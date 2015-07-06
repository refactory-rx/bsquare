module.exports = {

    init: (app) => {
		
        app.get("/api/events/:id/guests", (req, res) => {
			
			let eventId = req.params.id;
			
            app.authService.screenRequest(req, true, (result) => {
				
				let url_parts = url.parse(req.url, true);
				let params = url_parts.query;
				
				if(params.q) {
					app.guestService.getGuests(eventId, params.q)
                    .then((response) => {
						res.json(response);
					});
				} else {
					app.guestService.getGuests(eventId)
                    .then((response) => {
						res.json(response);
					});	
				}
				
				
			});
			
		});
		
		
        app.post("/api/events/:id/messages", (req, res) => {
			
			let message = req.body;
			
            app.authService.screenRequest(req, true, (result) => {
				
				app.guestService.sendMessage(message)
                .then((response) => {
					res.json(response);
				});
				
			});
			
		});
		
        app.get("/api/events/:id/messages", (req, res) => {
			
            app.authService.screenRequest(req, true, (result) => {
					
				app.guestService.getMessages(req.params.id)
                .then((response) => {
					res.json(response);
				});
			
			});
			
		});
		
	}

};
