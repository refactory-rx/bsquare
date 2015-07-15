import url from "url";

module.exports = {
    
    init: (app) => {

        let { isLoggedIn } = require("../../../shared/lib/RouteFilters")(app);
        
        app.get("/api/tickets", isLoggedIn, (req, res, next) => {

            console.log("get tickets");

            app.ticketService.getTickets({ user: req.auth.user }, (err, tickets) => {
                if (err) { return next(err); }
                res.json({ status: "ok", tickets: tickets });
            });

        });

        app.post("/api/tickets", (req, res) => {

            console.log("post tickets");

            let url_parts = url.parse(req.url, true);
            let urlParams = url_parts.query;
            let params = {
                userId: urlParams.userId,
                orderId: urlParams.orderId,
                qtysByResource: req.body
            };

            app.ticketService.createTickets(params, (response) => {
                res.json(response);
            });

        });

        app.get("/api/tickets/:id", (req, res, next) => {
            
            console.log("get one ticket");
             
            let params = {
                id: req.params.id,
                user: req.auth ? req.auth.user : null
            };

            app.ticketService.getTicket(params, (err, ticket) => { 
                if (err) { return next(err); }
                res.json({ status: "ok", ticket: ticket });
            });
        
        });
        
        app.put("/api/tickets/:id", isLoggedIn, (req, res, next) => {

            let params = {
                id: req.params.id,
                user: req.auth.user
            };

            app.ticketService.admitTicket(params, (err) => {
                if (err) { return next(err); }
                res.json({ status: "ok" });
            });

        });

    }

};
