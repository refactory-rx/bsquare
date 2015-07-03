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
            ticketService.getTickets(params, callback);
        },

        getTickets: (params, callback) => {
            ticketService.getTickets(params, callback);
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
