"use strict";

import url from "url";

module.exports = (app) => { 

    app.use("/api", (req, res, next) => {
        
        let url_parts = url.parse(req.url, true);
        req.query = url_parts.query;

        app.authService.screenRequest(req, true, (result) => {
            
            if (result.status === "authorized") {
                req.auth = result;
            }
            
            console.log("REQ "+req.url+" auth="+(result.status === "authorized"));
            next();

        });
        
    });

};
