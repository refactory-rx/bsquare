import Q from "q";
import url from "url";
import request from "request";
import fs from "fs";
import mongoose from "mongoose";

import translations from "../../../shared/translations";

let responseUtil = require('../utils/responseUtil');

let APP_BASE_URL;

let Profile,
    User,
    Order,
    OrdersByTicketResource,
    Ticket,
    Event,
    TicketResource;

class OrderService {

    constructor(app) {

        ({ APP_BASE_URL } = app.settings);
        
        ({
            Profile,
            User,
            Order,
            OrdersByTicketResource,
            Ticket,
            Event,
            TicketResource

        } = app.model);
        
        this.app = app;
        this.authService = app.authService;
        this.ticketService = app.ticketService;
        this.trackerService = app.trackerService;
        
    }

	getOrders(req, callback) {

		let url_parts = url.parse(req.url, true);
		let params = url_parts.query;
		let searchMode = {
			type: "default"
		};

        this.authService.screenRequest(req, true, (screenResult) => {

			if(screenResult.status !== "authorized") {
				callback(screenResult);
			} else {

				let orderId = req.param("id") || params.id;

				if(orderId) {

					params = { _id: orderId };
					searchMode.type = "id";

				} else if(params.text) {

					console.log(`text search: ${params.text}`);
					let text = params.text;
					let criteria = [];
					try {
						let objId = mongoose.Types.ObjectId(text);
						criteria.push( { _id: objId });
						searchMode.type = "textId";
					} catch(exception) {
						console.log("text was not an id");
						criteria.push({ status: { $regex: text, $options: "i" } });
						searchMode.type = "text";
						searchMode.text = text;
					}

					delete params.text;

				}

				let userId = screenResult.user.id;

				let customerUserIds = [];

				Event.find({ user: userId })
				.select("_id")
				.execQ()
                .then((eventIdsResult) => {

                    let eventIds = eventIdsResult.map((eventIdRow) => {
						return eventIdRow._id;
					});

					//params.event = { $in: eventIds };

					return Order.findQ(params);

				})
                .then((orders) => {

					orders = JSON.parse(JSON.stringify(orders));

					for(let i=0; i < orders.length; i++) {

						if(orders[i].user) {
							customerUserIds.push(orders[i].user);
						}

						if(orders[i].signupFields && orders[i].signupFields.length > 0) {
							for(let j=0; j < orders[i].signupFields.length; j++) {
								if(orders[i].signupFields[j].name === "email") {
									orders[i].orderEmail = orders[i].signupFields[j].value;
								}
							}
						}


					}


					if(customerUserIds.length > 0) {
						return User.findQ({ _id: { $in: customerUserIds }})
                        .then((users) => {
							for(let i=0; i < orders.length; i++) {
								for(let j=0; j < users.length; j++) {
									if(orders[i].user && orders[i].user == users[j]._id.toHexString()) {
										orders[i].userEmail = users[j].emailAddress;
									}
								}
							}

							return orders;

						})
                        .catch((error) => {
							console.log(error);
						});

					} else {
						return orders;
					}

				})
                .then((orders) => {

					let filteredOrders = [];
					if(searchMode.type === "text") {
						console.log(`filter on: ${searchMode.text}`);
						for(let i=0; i < orders.length; i++) {

							if( (orders[i].status && orders[i].status.indexOf(searchMode.text) != -1) ||
								(orders[i].orderEmail && orders[i].orderEmail.indexOf(searchMode.text) != -1) ||
								(orders[i].userProfile && (
									orders[i].userProfile.displayName.indexOf(searchMode.text) != -1 ||
									orders[i].userEmail.indexOf(searchMode.text) != -1
								))
							) {
								filteredOrders.push(orders[i]);
							}
						}

						orders = filteredOrders;

					}

					if(customerUserIds.length > 0) {
						Profile.findQ({ user: { $in: customerUserIds }})
                        .then((profiles) => {
							for(let i=0; i < orders.length; i++) {
								for(let j=0; j < profiles.length; j++) {
									if(orders[i].user && orders[i].user == profiles[j].user.toHexString()) {
										orders[i].userProfile = profiles[j];
									}
								}
							}

							let response = {
								success: 1,
								status: "ordersFound",
								data: orders
							};

							callback(response);

						})
                        .catch((error) => {
							console.log(error);
						});

					} else {

						let response = {
								success: 1,
								status: "ordersFound",
								data: orders
							};

							callback(response);

					}


				})
                .catch((error) => {

					console.log(error);

				});

			}

		});

	}

	getOrder(req, callback) {

		let orderId = req.params.id;
		let objId = orderId;

		let params = {
		    _id: objId
		};

        this.authService.screenRequest(req, true, (result) => {
            this.getOrderByParams(params, (response) => {
				callback(response);
			});
		});

	}

	getOrderByParams(params, callback) {

		let response = {
			success: 0,
			status: "none"
		};

        Order.findOne(params, (err, order) => {

			if(err) {

				response.status = "error";
				response.message = "Error reading data.";
				response.error = err;

				callback(response);

			} else {

				if(order) {

					response.success = 1;
					response.status = "orderFound";
					response.order = order;

					callback(response);

				} else {

					response.status = "orderNotFound";
					response.message = "Order not found.";

					callback(response);

				}

			}

		});

	}


	saveOrder(req, callback) {

		let saveOrderRequest = req.body;
		let action = saveOrderRequest.action;

		let response = {
			success: 0,
			status: "none"
		};

		let order = saveOrderRequest.order;

        this.authService.screenRequest(req, true, (screenResult) => {

    		if(action !== "new") {

    		    let orderId = order._id;

    		    delete order._id;

    		    if(order.signupStatus === "formFilled") {
                    order.signupStatus = "complete";
                }

                Order.update( { _id: orderId }, order, (err, numAffected) => {

    			    if(err) {

    				    response.status = "error";
    					response.message = "Failed to save order.";
    					response.error = err;
    					callback(response);

    			    } else {

    					response.success = 1;
    					response.status = "orderSaved";
    					response.message = "Order saved.";

    					//console.log('saved order: ');
    					console.log(order);

    					if(order.signupStatus === "complete" && order.status !== "orderFulfilled") {

                            let orderLink = APP_BASE_URL+"/#/order/"+orderId;
                            let emailContent = translations[req.headers["bsquare-language"]].orderEmail;
                            emailContent = emailContent.replace(/{orderLink}/g, orderLink);
                                                                
                            this.app.mailer.sendMail({
                                to: order.signupFields[0].value,
                                subject: "[B^2] Order created",
                                html: emailContent,
                                text: emailContent
                            }, (err, response) => {
                                console.log("mailer response", err, response);
                            });
                            
                            if(order.orderTotal === 0 || order.orderTotal > 300) {
                                this.fulfillOrder(orderId, (response) => {
		                			callback(response);
		                		});
		                	} else {
		            			callback(response);
		                	}

    					} else {
    						callback(response);
    					}

    			    }


    			});

    		} else {

    			let eventId = saveOrderRequest.eventId;
    			order.event = eventId;

    			order.timePlaced = (new Date()).getTime();

   				//console.log('create new order:');
   				//console.log(screenResult);

    			if(screenResult.status === "authorized") {
    			    order.user = screenResult.user.id;
    			}

    			let items = order.items;
    			let itemIds = [];
    			let qtyById = [];

    			for(let i=0; i < items.length; i++) {
    			    let itemId = items[i].ticketResource;
    			    itemIds.push(itemId);
    			    qtyById[items[i].ticketResource] = parseInt(items[i].quantity);
    			}

    			let orderTotal = 0;

    			//console.log('qtyById: ');
    			//console.log(qtyById);

                TicketResource.find( { _id: { $in: itemIds } }, (err, ticketResources) => {

    			    if(err) {

    				    response.status = "error";
                		response.message = "Could not read ticket data.";
                		response.error = err;

    				} else {

    				    if(ticketResources.length != itemIds.length) {

    				        response.status = "invalidItems";
                		    response.message = "Order request contains invalid information.";

    				    } else {

        				    for(let i=0; i < ticketResources.length; i++) {

        				        let idString = ticketResources[i]._id.toHexString();

        				        if(qtyById[idString] > ticketResources[i].qtyAvailable - ticketResources[i].qtyReserved) {
        				        	response.status = "soldOut";
        				        	response.message = `There are not enough tickets of type ${ticketResources[i].name} to satisfy this order.`;
        				        	response.ticketResource = idString;
        				        	callback(response);
        				        	return;
        				        }

        			            orderTotal += ticketResources[i].price * qtyById[idString];

        				    }

        				    order.orderTotal = orderTotal;

                            Event.findOne({ _id: order.event }, (err, event) => {

        				    	if(!event.signupFields || event.signupFields.length === 0) {
        				    		order.signupStatus = "complete";
        				    	}

        				    	order.status = "new";

                                Order.create(order, (err, createdOrder) => {

                                    if(err) {

                                        response.status = 'error';
                                        response.message = 'Failed to create order.';
                                        response.error = err;

                                        callback(response);

                                    } else {

                                        response.success = 1;
                                        response.status = 'orderCreated';
                                        response.message = 'Order created.';
                                        response.order = createdOrder;

                                        let qtyUpdates = ticketResources.map((ticketResource) => {

                                            return (() => {

                                                let deferred = Q.defer();

                                                let idString = ticketResource._id.toHexString();
                                                let qtyReserved = ticketResource.qtyReserved + qtyById[idString];
                                                console.log("qtyById / qtyReserved", ticketResource.qtyReserved, qtyById, qtyReserved);

                                                TicketResource.update( { _id: ticketResource._id }, { qtyReserved: qtyReserved }, (err, numAffected) => {
                                                    deferred.resolve(numAffected);
                                                });

                                                return deferred.promise;

                                            })();

                                        });

                                        Q.all(qtyUpdates)
                                        .then((updateResults) => {
                                            console.log('qty update results', updateResults);
                                        });


                                        this.updateOrderMap(createdOrder, ticketResources);
                                        
                                        if(order.signupStatus === "complete") {
                                            
                                            if(orderTotal === 0 || orderTotal > 300) {
                                                this.fulfillOrder(createdOrder._id.toHexString(), (response) => {
                                                    callback(response);

                                                });
                                            } else {
                                                callback(response);
                                            }
                                        } else {
                                            callback(response);
                                        }


                                    }


                                });


        				    });

    				    }

    				}

    			});

    		}

		});


	}


	updateOrderMap(order, ticketResources) {

        let updateOrderMaps = ticketResources.map((ticketResource) => {
			return OrdersByTicketResource.findOneQ({ ticketResourceId: ticketResource._id.toHexString() })
            .then((orderMap) => {
                if(orderMap) {
                    orderMap.orderIds.push(order._id.toHexString());
                    orderMap.save();
                } else {
                    orderMap = {
                        ticketResourceId: ticketResource._id.toHexString(),
                        orderIds: [order._id.toHexString()]
                    };
                    OrdersByTicketResource.create(orderMap);
                }
            });
		});

		Q.all(updateOrderMaps);

	}

	validateOrderSignupFields(order, event, callback) {

		order.signupStatus = 'complete';

		for(let i=0; i < event.signupFields.length; i++) {
        	let signupField = event.signupFields[i];
        	//console.log(signupField);
            if(signupField.required == 'true' && !signupField.value) {
            	order.signupStatus = 'formNotFilled';
                break;
           	}
        }

        callback(order);

	}

	fulfillOrder(orderId, callback) {

	    let response = {
			success: 0,
			status: "none"
		};
        
        Order.findOne( { _id: orderId }, (err, order) => {

            responseUtil.createFindResponse("Order", err, order, (response) => {
                
	       		if(response.success == 1) {

		            let items = order.items;
				    let itemIds = [];
				    let qtyById = {};

				    for(let i=0; i < items.length; i++) {
				        let itemId = items[i].ticketResource;
				        itemIds.push(itemId);
				        qtyById[items[i].ticketResource] = items[i].quantity;
				    }
                    
                    TicketResource.find( { _id: { $in: itemIds } }, (trErr, ticketResources) => {
                        
                        responseUtil.createFindResponse("TicketResource", trErr, ticketResources, (response) => {

				    		if(response.success == 1) {

                                let params = Object.assign({
                                    orderId: order._id.toString(),
                                    qtysByResource: qtyById
                                }, order.user ? { userId: order.user.toString() } : {});

                                this.ticketService.createTickets(params, (result) => {

                                    if(result.success === 0) {

                                        callback(result);

                                    } else if(result.status === "orderFulfilled") {

                                        Ticket.find( { orderId: order._id.toHexString() }, (err, tickets) => {

                                            Order.update( { _id: order._id }, { status: "fulfilled", tickets: tickets }, (orderUpdateErr, numAffected) => {

                                                responseUtil.createUpdateResponse("Order", orderUpdateErr, numAffected, (response) => {

                                                    if(response.success == 1) {
                                                        
                                                        order.tickets = tickets;
                                                        this.trackerService.checkGroupTrackingRules(order);
                                                        response.status = "orderFulfilled";
                                                        response.message = "Order fulfilled.";
                                                        response.order = order;
                                                        response.tickets = tickets;

                                                    }

                                                    callback(response);

                                                });

                                            });

                                        });

                                    } else {
                                        callback(result);
                                    }

                                });

				    		} else {

				    			callback(response);

				    		}

			    		});


				    });

			    } else {

			    	callback(response);

			    }

	        });

	    });

	}
    
    initRoutes() {
        let orderServiceRoutes = require("./orderServiceRoutes");
        orderServiceRoutes.init(this.app);
    }

}

module.exports = (app) => {
    return new OrderService(app);
};
