"use strict";

import request from "request";

module.exports = (app) => {

    let phantomService = require("./api/phantomService")(app);

    return {

        createTickets: (tickets, done) => {
            phantomService.createTickets(tickets)
            .then((tickets) => {
                done(null, tickets);
            })
            .catch((err) => {
                done(err);
            });
        },

        createTicket: (ticket, done) => {
            phantomService.createTicket(ticket)
            .then((ticket) => {
                done(null, ticket);
            })
            .catch((error) => {
                done(err);
            });
        },

        createPage: (url, done) => {
            phantomService.createPage(url)
            .then((data) => {
                done(null, data);
            })
            .catch((error) => {
                done(err);
            });
        }

    };

};
