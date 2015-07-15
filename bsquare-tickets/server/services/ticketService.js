import Q from "q";

import request from "request";
import fs from "fs";
import url from "url";
import moment from "moment";

import Errors from "../../../shared/lib/Errors";

let Ticket, TicketResource, Event, Order;
let APP_BASE_URL, SENDGRID_FROM, SENDGRID_USERNAME, SENDGRID_PASSWORD;

class TicketService {

    constructor(app) {
        ({ Ticket, TicketResource, Event, Order } = app.model);
        ({ APP_BASE_URL, SENDGRID_FROM, SENDGRID_USERNAME, SENDGRID_PASSWORD } = app.settings);
        this.app = app;
        this.sendgrid = require("sendgrid")(SENDGRID_USERNAME, SENDGRID_PASSWORD);
    }

    _checkTicketAdmissability(user, ticket) {

        let deferred = Q.defer();

        TicketResource.findOneQ({ _id: ticket.ticketResourceId })
        .then((ticketResource) => {

            if(ticketResource.authorizedInvalidation) {
                console.log("check event of the tkt rsrc");
                return Event.findOneQ({ _id: ticketResource.event });
            } else {
                ticket.allowInvalidation = false;
                deferred.resolve(ticket);
            }

        })
        .then((event) => {
            ticket.allowInvalidation = event.user.equals(user.id);
            deferred.resolve(ticket);
        });

        return deferred.promise;

    }

    getTicket(id, user) {

        let deferred = Q.defer();

        let ticket;

        Ticket.findOneQ({ _id: id })
        .then((ticket) => {
            
            if (!ticket) {
                return deferred.reject(new Errors.NotFound(null, { message: "ticket_not_found" }));
            }
            
            ticket = JSON.parse(JSON.stringify(ticket));
             
            if (!user) {
                ticket.allowInvalidation = false;
                return ticket;
            }
             
            return this._checkTicketAdmissability(user, ticket);

        })
        .then((ticket) => {
            deferred.resolve(ticket);
        })
        .catch((err) => {
            deferred.reject(err);
        });

        return deferred.promise;

    }

    admitTicket(id, user) {

        let deferred = Q.defer();

        Ticket.findOneQ({ _id: id })
        .then((ticket) => {

            if (!ticket) {
                deferred.reject(new Errors.NotFound(null, { message: "no_admissible_ticket_found" }));
                return;
            }

            return this._checkTicketAdmissability(user, ticket);

        })
        .then((ticket) => {
            if (ticket.allowInvalidation) {
                ticket.status = "used";
                Ticket.update({ _id: ticket._id }, { status: "used" }, (err) => {
                    if (err) { return deferred.reject(err); }
                    deferred.resolve();
                });
            } else {
                deferred.reject(new Errors.Unauthorized(null, { message: "not_authorized_to_invalidate_ticket" }));
            }
        })
        .catch((err) => {
            deferred.reject(err);
        });

        return deferred.promise;

    }

    getTickets(user) {

        console.log("get tktss, screen req");

        let deferred = Q.defer();

        Ticket.find({ userId: user.id }, (err, tickets) => {
            if (err) { return deferred.reject(err); }
            deferred.resolve(tickets);
        });
        
        return deferred.promise;

    }

    createTickets(params, callback) {

	    let response = {
	        success: 0,
	        status: "none"
	    };

        let userId = params.userId;
        let orderId = params.orderId;
        let qtysByResource = params.qtysByResource;

        let resourceIds = Object.getOwnPropertyNames(qtysByResource);

        TicketResource.find({ _id: { $in: resourceIds } }, (err, ticketResources) => {

            let tickets = [];

            for(let i=0; i < ticketResources.length; i++) {

                let ticketResource = ticketResources[i];
                let resourceId = ticketResource._id.toHexString();
                let ticketQty = qtysByResource[resourceId];

                let ticketsByResource = this.createTicketsFromResource(orderId, userId, ticketResource, ticketQty);
                tickets = tickets.concat(ticketsByResource);

            }

            console.log(`find order by id: ${orderId}`);
            Order.findOne({ _id: orderId }, (err, order) => {
                if(err) {
                    console.log(err);
                } else {
                    this.saveTickets(order, tickets, callback);
                }
            });

        });

    }

	saveTickets(order, tickets, callback) {

	    let response = {
		    success: 0
	    };

        Ticket.create(tickets, (ticketErr, ...createdTickets) => {

            console.log("ticket creation: ", ticketErr, createdTickets);

            if(ticketErr) {

                response.status = "error";
                response.message = "Could not create tickets.";
                response.error = ticketErr;

                callback(response);

            } else {

                createdTickets = createdTickets[0];

                let qtyByResource = {};
                tickets.forEach(ticket => {

			        if(!qtyByResource[ticket.ticketResourceId]) {
			            qtyByResource[ticket.ticketResourceId] = 0;
		    	    }

		    	    qtyByResource[ticket.ticketResourceId] += 1;

		        });

                let resourceIds = Object.keys(qtyByResource);
                let qtyUpdates = resourceIds.map((resourceId) => {

                    return TicketResource.findOneQ({ _id: resourceId }).then((ticketResource) => {
			            let ticketQty =  qtyByResource[ticketResource._id.toHexString()];
			            let qtyAvailable = ticketResource.qtyAvailable - ticketQty;
		    	        let qtyReserved = ticketResource.qtyReserved - ticketQty;
		    	        let qtySold = ticketResource.qtySold + ticketQty;
		    	        TicketResource.update(
                            { _id: ticketResource._id },
                            {
                                qtyAvailable: qtyAvailable,
                                qtyReserved: qtyReserved,
                                qtySold: qtySold
                            },
                            (err, numAffected) => {
				                console.log("qty updated for "+ticketResource.name, qtyAvailable, qtyReserved, qtySold);
		    		        }
			            );
		    	    });

                });

                console.log("qtyUpdates:", qtyUpdates.length);
                Q.all(qtyUpdates);

                let emailContent = "Your tickets have been issued<br/><br/>";

                createdTickets.forEach(ticket => {
                    emailContent +=
                        `<a href="${APP_BASE_URL}/#/ticket/${ticket._id}">
                            ${ticket.ticketName}
                         </a><br/>`;
                });

                emailContent +=
                    `<br/><br/>
                    B SQUARED`;

                let phantomService = this.app.phantomService;
                phantomService.createTickets(createdTickets, (result) => {

                    let orderEmail;
                    for(let i=0; i < order.signupFields.length; i++) {
                        console.log(order.signupFields[i]);
                        if(order.signupFields[i].name === "email") {
                            orderEmail = order.signupFields[i].value;
                            break;
                        }
                    }

		            console.log(`send email to ${orderEmail}`);

                    let files = result.tickets.map((ticket) => {
			            return {
				            filename: `ticket${ticket.id}.pdf`,
				            content: ticket.data
			            };
			        });

                    this.sendgrid.send({
                        to: orderEmail,
                        from: SENDGRID_FROM,
                        subject: "[B2] Your tickets",
                        text: emailContent,
                        html: emailContent,
                        files: files
                    }, (err, json) => {
                        console.log("SENDGRID RESPONSE", err, json);
                    });

                    callback({ success: 1, status: "orderFulfilled" });

                });

		    }

	    });

	}

	createTicketsFromResource(orderId, userId, ticketResource, quantity) {

	    let tickets = [];

	    for(let i=0; i < quantity; i++) {

            let ticket = {

                ticketResourceId: ticketResource._id.toHexString(),
                orderId: orderId,

                eventName: ticketResource.eventName,
                eventPlace: ticketResource.eventPlace,
                startTime: ticketResource.eventStarts,
                ticketName: ticketResource.name,
                price: ticketResource.price,
                currency: ticketResource.currency,
                bundledProducts: ticketResource.bundledProducts,
                discountCode: "DMMY8769"

            };

            if(userId) {
                ticket.userId = userId;
            }

            tickets.push(ticket);

	    }

	    return tickets;

    }

    initRoutes() {
        let ticketServiceRoutes = require("./ticketServiceRoutes");
        ticketServiceRoutes.init(this.app);
    }

}

module.exports = (app) => {
    return new TicketService(app);
};
