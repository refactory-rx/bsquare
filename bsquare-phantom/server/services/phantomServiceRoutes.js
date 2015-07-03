module.exports = {
    
    init: (app) {
        
        app.post("/api/tickets", (req, res) => {
            console.log("post tickets", req.body); 
            app.phantomService.createTickets(req.body.tickets, (response) => {
		        res.json(response);
            });
	    });

        app.post("/api/ticket", (req, res) => {            
            console.log("post ticket", req.body);
            app.phantomService.createTicket(req.body.ticket, (err, ticket) => {
                console.log(err, ticket);
                res.json({ status: "ok", ticket: ticket });
            });
	    });

	}

};
