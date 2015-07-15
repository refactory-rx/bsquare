import url from "url";

let responseUtil = require("../utils/responseUtil");
let RefTracker, ImpressionTracker, Order, Ticket, Event;

class TrackerService {

    constructor(app) {
        ({ RefTracker, ImpressionTracker, Order, Ticket, Event } = app.model);
        this.app = app;
        this.authService = app.authService;
    }
    
	getRefTrackers(req, callback) {
		
		let params = req.body.refTracker;
		
        this.authService.screenRequest(req, true, (result) => {
			
            this.getRefTrackersByParams(params, (response) => {
				callback(response);
			});
			
		});
		
	}
	
	getRefTrackersByParams(params, callback) {
		
		let response = {
			success: 0,
			status: "none"
		};
		
        RefTracker.find(params, (err, refTrackers) => {
			
			if(err) {
					
				response.status = "error";
				response.message = "Error reading data.";
				response.error = err;
				
				callback(response);
				
			} else {
						
				if(refTrackers) {
					
					response.success = 1;
					response.status = "refTrackersFound";
					response.refTrackers = refTrackers;
					
					if(refTrackers.length === 0) {
						response.status = "zeroRefTrackersFound";
					} else if(refTrackers.length == 1) {
						response.refTracker = refTrackers[0];
						response.status = "refTrackerExisted";
					}
					
					callback(response);
							
				} else {
					
					response.status = "refTrackersNotFound";
					response.message = "refTrackers not found.";
							
					callback(response);
					
				}
						
			}
				
			
		});
		
	}
	
	saveRefTracker(req, callback) {
		
		let refTrackerRequest = req.body;
		
		let response = {
			success: 0,
			status: "none"
		};
				
		let refTracker = refTrackerRequest.refTracker;
			    
        RefTracker.create(refTracker, (err, createdRefTracker) => {
			
       		if(err) {
            	response.status = "error";
                response.message = "Failed to create refTracker.";
                response.error = err;
        	} else {
            	response.success = 1;
                response.status = "refTrackerCreated";
                response.message = "refTracker created.";
                response.refTrackers = [ createdRefTracker ];
                response.refTracker = createdRefTracker;
            }
                		
            callback(response);
		
		});
		
		
	}
	
    createTicketResourceMap(orders, exclOrder) {
		
		let qtysByTicketResource = [];
			
	    order.forEach(order => {

			let items = order.items;
			
			let orderId = order._id.toHexString();
			let exclOrderId = null;
			
			if(exclOrder) {
				exclOrderId = exclOrder._id.toHexString();
				//console.log(orderId+" == "+exclOrderId+" = "+(orderId == exclOrderId));
			}
			
			if(exclOrder && orderId == exclOrderId) {
				//console.log("skip excluded order "+orderId);
				return;
			}
			
		    items.forEach(item => {

				if(!qtysByTicketResource[item.ticketResource]) {
					qtysByTicketResource[item.ticketResource] = 0;
				}
				
				qtysByTicketResource[item.ticketResource] += item.quantity;
						
			});
			
			
		});
		
		return qtysByTicketResource;
		
	}
	
	addRewardToTickets(orders, ticketResourceId, reward) {
		
		//console.log("addRewardToTickets: orders.length="+orders.length);
		
        orders.forEach(order => {

			let rewardsAdded = false;
			
            order.tickets.forEach(ticket => {

				if(ticket.ticketResourceId == ticketResourceId) {
					this.updateTicketWithReward(order, ticket, reward);
					rewardsAdded = true;
				}
				
			});
			
			//console.log("order "+order._id+" add="+rewardsAdded);
			
			if(rewardsAdded) {	
				this.updateOrderWithTickets(order, order.tickets);
			}
			
		});
			
	}
	
	updateTicketWithReward(order, ticket, reward) {
		
		if(!ticket.rewards) {
			ticket.rewards = [];
		}
					
		ticket.rewards.push(reward);
					
        Ticket.update({ 
            orderId: order._id.toHexString(), 
            ticketResourceId: ticket.ticketResourceId 
        }, { rewards: ticket.rewards }, { multi: true }, (err, numAffected) => {
						
			if(err) {
				//console.log(err);
			} else {
				//console.log("updated "+numAffected+" tickets");
			}
						
		});
				
			
	}
	
	updateOrderWithTickets(order, tickets) {
		
        Order.update({ _id: order._id }, { tickets: tickets }, (err, numAffected) => {
					
			if(err) {
				//console.log(err);
			}
					
		});
				
	}
	
	detectGroupRewardConditions(event, orders, newOrder) {
		
		//console.log("detectRewardConditions, orders.length="+orders.length);
		
		let groupRewards = event.groupRewards;
							
		let origQtysMap = this.createTicketResourceMap(orders, newOrder);
		let newQtysMap = this.createTicketResourceMap(orders);
							
        groupRewards.conditions.forEach(rewardCondition => {

			let ticketResourceId = rewardCondition.ticketResource._id;
			let qtyBefore = origQtysMap[ticketResourceId];
			let qtyAfter = newQtysMap[ticketResourceId];
			//console.log(origQtysMap);
			//console.log(newQtysMap);
			
			if(qtyAfter && qtyAfter >= rewardCondition.quantity) {
				if(!qtyBefore || qtyBefore < rewardCondition.quantity) {
					// Add to all tickets
					this.addRewardToTickets(orders, ticketResourceId, rewardCondition.reward);
				} else {
					// Add to new tickets
					this.addRewardToTickets([newOrder], ticketResourceId, rewardCondition.reward);
				}
			}
													
		});
			
	}
	
	checkGroupTrackingRules(newOrder) {
		
		//console.log("checkGroupTrackingRules");	
        this.getOrdersByTracker(newOrder.event, newOrder.groupTrackerId, "group", (event, orders) => {
			this.detectGroupRewardConditions(event, orders, newOrder);
		});
			
	}
	
	checkRefTrackingRules(newOrder) {
		
		//console.log("checkRefTrackingRules");
		
        this.getOrdersByTracker(newOrder.event, newOrder.groupTrackerId, "ref", (event, orders) => {
			this.detectGroupRewardConditions(event, orders, newOrder);
		});
			
	}
	
	getOrdersByTracker(eventId, trackerId, type, callback) {
		
		//console.log("checkTrackingRules for type "+type);		
		let response = {};
		
		if(!trackerId) {
			return { "error": "missingTrackerId" };
		}
		
        Event.findOne( { _id: eventId }, (err, event) => {
			
            responseUtil.createFindResponse("Event", err, event, (response) => {
				
				if(response.success == 1) {
					
					let trackerQuery = {};
					if(type == "ref") {
						trackerQuery.refTrackerId = trackerId;	
					} else if(type == "group") {
						trackerQuery.groupTrackerId = trackerId;
					}
					
                    Order.find( trackerQuery, (err, orders) => {
						
                        responseUtil.createFindResponse("Order", err, orders, (response) => {
								
							if(response.success == 1) {
								callback(event, orders);
							}
									
						});
							
										
					});
						
				}
					
			});
			
			
		});
		
	}
	
	getStatsByRefTrackers(refTrackers, callback) {
		
        let trackerIds = [];
        refTrackers.forEach(refTracker => {
			trackerIds.push(refTracker._id.toHexString());
		});
		
        Order.find({ 
            $or: [ 
                { groupTrackerId: { $in: trackerIds } },
                { refTrackerId: { $in: trackerIds } } 
            ] 
        }, (err, orders) => {
			
            responseUtil.createFindResponse("Order", err, orders, (response) => {
				
				let numTickets = 0;
				let numOrders = 0;
				let revenue = 0;
					
				if(response.success == 1) {
					
					//console.log("orders.length = "+orders.length);
					
                    orders.forEach(order => {
                        order.items.forEach(item => {    
							numTickets += item.quantity;
						});	
						revenue += order.orderTotal;
						numOrders += 1;
					});
						
					let refStats = {
						numTickets: numTickets,
						numOrders: numOrders,
						revenue: revenue,
					};
						
					response.refStats = refStats;
					delete response.data;
						
				}
					
				//console.log(response);
				callback(response);
					
			});
			
		});	
		
	}
	
	getRefStats(req, callback) {
		
		let response = {
			success: 0,
			status: "none"
		};
		
        this.authService.screenRequest(req, true, (result) => {
			
			let user = result.user;
			//console.log(user);
			
            RefTracker.find( { userId: user.id }, (err, refTrackers) => {
				
                responseUtil.createFindResponse("RefTracker", err, refTrackers, (response) => {
					
					if(response.success == 1) {
						
						//console.log("found "+refTrackers.length+" refTrackers");
						
                        this.getStatsByRefTrackers(refTrackers, (response) => {
							
							let refTrackerIds = [];
                            refTrackers.forEach(refTracker => {
								refTrackerIds.push(refTracker._id.toHexString());
							});
							
                            ImpressionTracker.find( { refTrackerId: { $in: refTrackerIds } }, (err, impressionTrackers) => {
								
								if(err) {
									//console.log(err);
								} else {
									response.refStats.impressions = impressionTrackers.length;
								}
								
								callback(response);
								
							});
							
							
						});
						
					} else {
						callback(response);
					}
					
				});
				
			});
			
			
		});
		
			
	}

    initRoutes() {
        let trackerServiceRoutes = require("./trackerServiceRoutes");
        trackerServiceRoutes.init(this.app);
    }
	
}

module.exports = (app) => {
    return new TrackerService(app);
};
