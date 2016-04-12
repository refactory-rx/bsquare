import url from "url";
import * as Errors from "../../../shared/lib/Errors";

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
      
      let filters = {};
      if (req.query.type) filters["type"] = req.query.type;
      if (req.query.time) filters["time"] = req.query.time;
      if (req.query.loc) filters["location"] = req.query.loc;
            
      if (req.query.q || Object.keys(filters).length > 0) {
          
        app.eventService.searchEventsByText(req.query.q, filters)
        .then((events) => {
            res.json({ status: "ok", events: events });
        })
        .catch((err) => {
            next(err);
        });
         
        return;

      }
            
      if (req.query.kind === "own") {
          
        if (!req.auth) {
          next(new Errors.Forbidden(null, { message: "unauthorized_request" }));
          return;
        }

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

    app.get("/api/events/slug", (req, res, next) => {
            
      if (req.query.slug) { 
          
          app.eventService.checkSlug(req.query.slug)
          .then((available) => {
              res.json({ status: "ok", available: available });
          })
          .catch((err) => {
              next(err);
          });

      } else if (req.query.title) {
          
          app.eventService.getSlugs(req.query.title)
          .then((slugs) => {
              res.json({ status: "ok", slugs: slugs });
          })
          .catch((err) => {
              next(err);
          });
      
      } else {
          next(new Errors.UnprocessableEntity(null, { message: "invalid_params" }));
      }

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
        console.log("got event", event.refRewards);
        app.eventService.updateImpressions(event._id, tracking);
        res.json(Object.assign(
          { status: "ok", event: event },
          req.auth && event.user.equals(req.auth.user.id) ? 
            { ownEvent: "true" } : {}
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
