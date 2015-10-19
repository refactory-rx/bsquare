"use strict";

import request from "request";

module.exports = (app) => {

    let phantomService = require("./api/phantomService")(app);

    return {

        createTickets: (tickets, callback) => {
            phantomService.createTickets(tickets, callback);
        },

        createTicket: (ticket, callback) => {
            phantomService.createTicket(ticket)
            .then((ticket) => {
                callback({ status: "ok", ticket: ticket });
            })
            .catch((error) => {
                callback({ status: "error", error: error });
            });
        },

        createPage: (url, callback) => {
            phantomService.createPage(url)
            .then((data) => {
                callback({ status: "ok", data: data });
            })
            .catch((error) => {
                callback({ status: "error", error: error });
            });
        }

    };

};
