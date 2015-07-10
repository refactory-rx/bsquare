"use strict";

import url from "url";
import request from "request";

module.exports = (app) => {

    let ticketService = require("./server/services/ticketService")(app);

    return {

        initRoutes: () => {
            ticketService.initRoutes()
        },

        getTicket: (params, callback) => {

            ticketService.getTicket(params.id, params.user)
            .then((ticket) => {
                callback(null, ticket);
            })
            .catch((err) => {
                callback(err);
            });

        },

        getTickets: (params, callback) => {
            
            ticketService.getTickets(params.user)
            .then((tickets) => {
                callback(null, tickets);
            })
            .catch((err) => {
                callback(err);
            });
            
        },
        
        admitTicket: (params, callback) => {

            ticketService.admitTicket(params.id, params.user)
            .then(() => {
                callback();
            })
            .catch((err) => {
                callback(err);
            });

        },

        createTickets: (params, callback) => {
            ticketService.createTickets(params, callback);
        },

        createTicketsAjax: (params, callback) => {

            var uri = `${app.settings.ICKET_SERVICE_URL}/api/tickets?orderId=${params.orderId}&userId=${params.userId}`;

            var options = {
                uri: uri,
                method: "POST",
                json: params.qtysByResource
            };

            console.log(options);
            request(options, (err, res, body) => {
                console.log(err, body);
                callback(err, body);
            });

        }

    };

}
