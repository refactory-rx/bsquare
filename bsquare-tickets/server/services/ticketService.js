import Q from "q";

import request from "request";
import fs from "fs";
import url from "url";
import moment from "moment";

let Ticket, TicketResource, Event, Order;
let APP_BASE_URL, SENDGRID_FROM, SENDGRID_USERNAME, SENDGRID_PASSWORD;

class TicketService {

    constructor(app) {
        ({ Ticket, TicketResource, Event, Order } = app.model);
        ({ APP_BASE_URL, SENDGRID_FROM, SENDGRID_USERNAME, SENDGRID_PASSWORD } = app.settings);
        this.app = app;
        this.sendgrid = require("sendgrid")(SENDGRID_USERNAME, SENDGRID_PASSWORD);
    }

    getTickets(params, callback) {

        console.log("get tickets, screen req");

        let findParams = {};

        if(params.id) {

            findParams._id = params.id;

        } else {

            if(params.user) {
                findParams.userId = params.user.id;
            } else {
                callback({ success: 0, status: "unauthrized" });
                return;
            }

        }

        if(findParams._id && params.use === "admit") {

            Ticket.update( { _id: findParams._id }, { status: "used" }, (err, numAffected) => {

                let response = { success: 0 };

                if(err) {
                    response.status = "errorUpdatingTicketStatus";
                    response.error = err;
                } else {
                    if(numAffected != 1) {
                        response.status = "ticketNotFound";
                    } else {
                        response.success = 1;
                        response.status = "ticketUsed";
                    }
                }

                callback(response);

            });

        } else {

            console.log("tickets findParams", findParams);

            Ticket.find(findParams, (err, tickets) => {

                let response = { success: 0 };

                if(err) {

                    response.status = "errorFindingTickets";
                    response.error = err;
                    callback(response);

                } else {

                    tickets = JSON.parse(JSON.stringify(tickets));

                    response.success = 1;
                    response.status = "ticketsFound";
                    response.data = tickets;

                    if(findParams._id) {

                        console.log("check tkt invalidation auth");

                        TicketResource.findOneQ({ _id: tickets[0].ticketResourceId })
                        .then((ticketResource) => {

                            if(ticketResource.authorizedInvalidation) {
                                if(result.status === "authorized") {
                                    console.log("check event of the tkt rsrc");
                                    return Event.findOneQ({ _id: ticketResource.event });
                                } else {
                                    tickets[0].allowInvalidation = false;
                                    callback(response);
                                }

                            } else {

                                tickets[0].allowInvalidation = true;
                                callback(response);

                            }

                        })
                        .then((event) => {

                            console.log("check event ownership");

                            if(event.user.toHexString() == result.user.id) {
                                tickets[0].allowInvalidation = true;
                            } else {
                                tickets[0].allowInvalidation = false;
                            }

                            callback(response);

                        });

                    } else {

                        callback(response);

                    }

                }

            });


        }


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
                    console.log("created ticket", ticket);
                    createdTickets.push(ticket);
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
