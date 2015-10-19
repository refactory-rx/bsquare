"use strict";

import log4js from "log4js";

let log = log4js.getLogger("PhantomServiceRoutes");

module.exports = {

    init: (app) {

        app.post("/api/tickets", (req, res, next) => {
            log.debug("post tickets", req.body);
            app.phantomService.createTickets(req.body.tickets, (err, tickets) => {
                if (err) { return next(err); }
                res.json({ status: "ok", tickets: tickets });
            });
        });

        app.post("/api/ticket", (req, res, next) => {
            log.debug("post ticket", req.body);
            app.phantomService.createTicket(req.body.ticket, (err, ticket) => {
                if (err) { return next(err); }
                res.json({ status: "ok", ticket: ticket });
            });
        });

    }

};
