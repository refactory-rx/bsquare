import url from "url";

module.exports = {

    init: (app) => {

        app.get("/api/tickets", (req, res) => {

            console.log("get tickets");

            app.authService.screenRequest(req, true, (result) => {

                let url_parts = url.parse(req.url, true);
                let params = url_parts.query;                
                if (result.status === "authorized") {
                    params.user = result.user;
                }

                app.ticketService.getTickets(params, (response) => {
                    res.json(response);
                });

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

        app.get("/api/tickets/:id", (req, res) => {

            app.authService.screenRequest(req, true, (result) => {

                let url_parts = url.parse(req.url, true);
                let params = url_parts.query;
                params.id = req.params.id;
                if (result.status === "authorized") {
                    params.user = result.user;
                }

                app.ticketService.getTickets(params, (response) => {
                    res.json(response);
                });

            });

        });

    }

};
