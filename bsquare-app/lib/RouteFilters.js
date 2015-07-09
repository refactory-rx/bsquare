"use strict";

import Errors from "./Errors";

module.exports = (app) => {
    
    let filters = {}; 
    
    filters.isLoggedIn = (req, res, next) => {
        if (req.auth) {
            next();
        } else {
            next(new Errors.Unauthorized("unauthorized", { message: "log-in failed" }));
        }
    };

    return filters;

};
