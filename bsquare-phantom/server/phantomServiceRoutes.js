"use strict";

import log4js from "log4js";

let log = log4js.getLogger("PhantomServiceRoutes");

module.exports = {

    init: (app) {

        app.post("/api/tickets", (req, res) => {
            log.debug("post tickets", req.body);
            app.phantomService.createTickets(req.body.tickets, (response) => {
		        res.json(response);
            });
	    });

        app.post("/api/ticket", (req, res) => {
            log.debug("post ticket", req.body);
            app.phantomService.createTicket(req.body.ticket, (err, ticket) => {
                log.debug(err, ticket);
                res.json({ status: "ok", ticket: ticket });
            });
	    });

	}

};
