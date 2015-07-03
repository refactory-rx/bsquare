"use strict";

import request from "request";

module.exports = (app) => {
    
    let phantomService = require("./server/services/phantomService")(app);
    
    return {

        createTickets: (tickets, callback) => {
            phantomService.createTickets(tickets, callback);  
        },

        createTicket: (ticket, callback) => {
            phantomService.createTicket(ticket)
            .then((ticket) => {
                callback({ success: 1, status: "ticketCreated", ticket: ticket });
            })
            .catch((error) => {
                callback({ success: 0, status: "ticketCreationFailed", error: error });
            });
        }

    }; 

};
