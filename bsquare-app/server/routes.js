import mongoose from "mongoose";
import url from "url";

module.exports = (app) => {

    let Event = app.model.Event;
    
    app.loginService.start();
    app.orderUpdates.start();

    app.eventService.initRoutes();
    app.loginService.initRoutes();
    app.orderService.initRoutes();
    app.paymentService.initRoutes();
    app.trackerService.initRoutes();
    app.statsService.initRoutes();
    app.guestService.initRoutes();
    app.ticketService.initRoutes();

    app.get("/e/:slug", (req, res) => {
        Event.findOne({ slug: req.params.slug }, (err, event) => {
            if(!err || event) {
                res.redirect(`/#/event/${event._id}`);
            } else {
                res.redirect("/404.html");
            }

        });
    });

    app.get("/i", (req, res) => {

        var url = `${app.settings.APP_BASE_URL}/main-index.html#${req.query.route}`;
        console.log("phantom page:", url);
        let phantomService = app.phantomService;
        phantomService.createPage(url, (result) => {
            res.send(result.data);
        });
    
    });

    app.get("/", (req, res) => {
        res.sendFile(app.settings.WEB_CONTENT_PATH+"/main-index.html");
    });

};
