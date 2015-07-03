var url = require('url');

var responseUtil = require('../utils/responseUtil');

module.exports = function(app) {
    
    let { RefTracker, ImpressionTracker, Order, Ticket, Event } = app.model;

    var module = {};

    module.exports = {

	getRefTrackers: function(req, callback) {
		
		var params = req.body.refTracker;
		
		app.authService.screenRequest(req, true, function(result) {
			
			module.exports.getRefTrackersByParams(params, function(response) {
				callback(response);
			});
			
		});
		
	},
	
	
	getRefTrackersByParams: function(params, callback) {
		
		var response = {
			success: 0,
			status: 'none'
		};
		
		//console.log('reftracker params:');
		//console.log(params);
		
		RefTracker.find(params, function(err, refTrackers) {
			
			if(err) {
					
				response.status = 'error';
				response.message = 'Error reading data.';
				response.error = err;
				
				callback(response);
				
			} else {
						
				if(refTrackers) {
					
					response.success = 1;
					response.status = 'refTrackersFound';
					response.refTrackers = refTrackers;
					
					if(refTrackers.length === 0) {
						response.status = 'zeroRefTrackersFound';
					} else if(refTrackers.length == 1) {
						response.refTracker = refTrackers[0];
						response.status = 'refTrackerExisted';
					}
					
					callback(response);
							
				} else {
					
					response.status = 'refTrackersNotFound';
					response.message = 'refTrackers not found.';
							
					callback(response);
					
				}
						
			}
				
			
		});
		
	},
	
	
	saveRefTracker: function(req, callback) {
		
		var refTrackerRequest = req.body;
		
		//console.log(refTrackerRequest);
		
		var response = {
			success: 0,
			status: 'none'
		};
				
		var refTracker = refTrackerRequest.refTracker;
			    
		RefTracker.create(refTracker, function(err, createdRefTracker) {
			
       		if(err) {
            	response.status = 'error';
                response.message = 'Failed to create refTracker.';
                response.error = err;
        	} else {
            	response.success = 1;
                response.status = 'refTrackerCreated';
                response.message = 'refTracker created.';
                response.refTrackers = [ createdRefTracker ];
                response.refTracker = createdRefTracker;
            }
                		
            callback(response);
		
		});
		
		
	},
	
	
	createTicketResourceMap: function(orders, exclOrder) {
		
		var qtysByTicketResource = [];
			
		for(var i=0; i<orders.length; i++) {
				
			var order = orders[i];
			var items = order.items;
			
			var orderId = order._id.toHexString();
			var exclOrderId = null;
			
			if(exclOrder) {
				exclOrderId = exclOrder._id.toHexString();
				//console.log(orderId+' == '+exclOrderId+' = '+(orderId == exclOrderId));
			}
			
			if(exclOrder && orderId == exclOrderId) {
				//console.log('skip excluded order '+orderId);
				continue;
			}
			
			for(var j=0; j<items.length; j++) {
						
				var item = items[j];
						
				if(!qtysByTicketResource[item.ticketResource]) {
					qtysByTicketResource[item.ticketResource] = 0;
				}
				
				qtysByTicketResource[item.ticketResource] += item.quantity;
						
			}
			
			
		}
		
		return qtysByTicketResource;
		
	},
	
	
	addRewardToTickets: function(orders, ticketResourceId, reward) {
		
		//console.log('addRewardToTickets: orders.length='+orders.length);
		
		for(var i=0; i<orders.length; i++) {
			
			var order = orders[i];
			
			var rewardsAdded = false;
			
			for(var j=0; j<order.tickets.length; j++) {
				
				if(order.tickets[j].ticketResourceId == ticketResourceId) {
					
					module.exports.updateTicketWithReward(order, order.tickets[j], reward);
					rewardsAdded = true;
					
				}
				
			}
			
			//console.log('order '+order._id+' add='+rewardsAdded);
			
			if(rewardsAdded) {
				
				module.exports.updateOrderWithTickets(order, order.tickets);
				
			}
			
		}
		
			
	},
	
	
	updateTicketWithReward: function(order, ticket, reward) {
		
		if(!ticket.rewards) {
			ticket.rewards = [];
		}
					
		ticket.rewards.push(reward);
					
		Ticket.update( { orderId: order._id.toHexString(), ticketResourceId: ticket.ticketResourceId }, 
			{ rewards: ticket.rewards }, { multi: true }, function(err, numAffected) {
						
			if(err) {
				//console.log(err);
			} else {
				//console.log('updated '+numAffected+' tickets');
			}
						
		});
				
			
	},
	
	
	updateOrderWithTickets: function(order, tickets) {
		
		Order.update({ _id: order._id }, { tickets: tickets }, function(err, numAffected) {
					
			if(err) {
				//console.log(err);
			}
					
		});
				
	},
	
	
	detectGroupRewardConditions: function(event, orders, newOrder) {
		
		//console.log('detectRewardConditions, orders.length='+orders.length);
		
		var groupRewards = event.groupRewards;
							
		var origQtysMap = module.exports.createTicketResourceMap(orders, newOrder);
		var newQtysMap = module.exports.createTicketResourceMap(orders);
							
		for(var i=0; i<groupRewards.conditions.length; i++) {
								
			var rewardCondition = groupRewards.conditions[i];
			var ticketResourceId = rewardCondition.ticketResource._id;
			var qtyBefore = origQtysMap[ticketResourceId];
			var qtyAfter = newQtysMap[ticketResourceId];
			//console.log(origQtysMap);
			//console.log(newQtysMap);
			
			if(qtyAfter && qtyAfter >= rewardCondition.quantity) {
				if(!qtyBefore || qtyBefore < rewardCondition.quantity) {
					// Add to all tickets
					module.exports.addRewardToTickets(orders, ticketResourceId, rewardCondition.reward);
				} else {
					// Add to new tickets
					module.exports.addRewardToTickets([newOrder], ticketResourceId, rewardCondition.reward);
				}
			}
								
								
		}
			
	},
	
	
	checkGroupTrackingRules: function(newOrder) {
		
		//console.log('checkGroupTrackingRules');
		
		module.exports.getOrdersByTracker(newOrder.event, newOrder.groupTrackerId, 'group', function(event, orders) {
			module.exports.detectGroupRewardConditions(event, orders, newOrder);
		});
		
			
	},
	
	
	checkRefTrackingRules: function(newOrder) {
		
		//console.log('checkRefTrackingRules');
		
		module.exports.getOrdersByTracker(newOrder.event, newOrder.groupTrackerId, 'ref', function(event, orders) {
			module.exports.detectGroupRewardConditions(event, orders, newOrder);
		});
		
			
	},
	
	
	getOrdersByTracker: function(eventId, trackerId, type, callback) {
		
		//console.log('checkTrackingRules for type '+type);
		
		var response = {};
		
		if(!trackerId) {
			return { 'error': 'missingTrackerId' };
		}
		
		Event.findOne( { _id: eventId }, function(err, event) {
			
			responseUtil.createFindResponse('Event', err, event, function(response) {
				
				if(response.success == 1) {
					
					var trackerQuery = {};
					if(type == 'ref') {
						trackerQuery.refTrackerId = trackerId;	
					} else if(type == 'group') {
						trackerQuery.groupTrackerId = trackerId;
					}
					
					Order.find( trackerQuery, function(err, orders) {
						
						responseUtil.createFindResponse('Order', err, orders, function(response) {
								
							if(response.success == 1) {
								callback(event, orders);
							}
									
						});
							
										
					});
						
				}
					
			});
			
			
		});
		
		
	},
	
	
	getStatsByRefTrackers: function(refTrackers, callback) {
		
		var trackerIds = [];
		for(var i=0; i<refTrackers.length; i++) {
			trackerIds.push(refTrackers[i]._id.toHexString());
		}
		
		Order.find( { $or: [ { groupTrackerId: { $in: trackerIds } }, { refTrackerId: { $in: trackerIds } } ] }, function(err, orders) {
			
			responseUtil.createFindResponse('Order', err, orders, function(response) {
				
				var numTickets = 0;
				var numOrders = 0;
				var revenue = 0;
					
				if(response.success == 1) {
					
					//console.log('orders.length = '+orders.length);
					
					for(var i=0; i<orders.length; i++) {
						
						for(var j=0; j<orders[i].items.length; j++) {
							var item = orders[i].items[j];
							numTickets += item.quantity;
						}
							
						revenue += orders[i].orderTotal;
						numOrders += 1;
						
						
					}
						
					var refStats = {
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
		
	},
	
	getRefStats: function(req, callback) {
		
		var response = {
			success: 0,
			status: 'none'
		};
		
		app.authService.screenRequest(req, true, function(result) {
			
			var user = result.user;
			//console.log(user);
			
			RefTracker.find( { userId: user.id }, function(err, refTrackers) {
				
				responseUtil.createFindResponse('RefTracker', err, refTrackers, function(response) {
					
					if(response.success == 1) {
						
						//console.log('found '+refTrackers.length+' refTrackers');
						
						module.exports.getStatsByRefTrackers(refTrackers, function(response) {
							
							var refTrackerIds = [];
							for(var i=0; i<refTrackers.length; i++) {
								refTrackerIds.push(refTrackers[i]._id.toHexString());
							}
							
							ImpressionTracker.find( { refTrackerId: { $in: refTrackerIds } }, function(err, impressionTrackers) {
								
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
		
			
	},
	
	
	initRoutes: function() {
		
		app.get('/api/refstats', function(req, res) {
			
			module.exports.getRefStats(req, function(response) {
				res.json(response);
			});
			
		});
		
		app.post('/api/reftrackers', function(req, res) {
			
			module.exports.getRefTrackers(req, function(result) {
				
				//console.log(result);
				
				if(result.success == 1) {
					
					if(result.status == 'zeroRefTrackersFound' || result.status == 'trackersNotFound') {
						
						module.exports.saveRefTracker(req, function(result) {
							res.json(result);
						});
					
					} else if(result.refTrackers.length == 1) {
						
						if(result.status == 'refTrackersFound') {
							result.status = 'refTrackerExisted';
							result.message = 'refTracker existed.';
							result.refTracker = result.refTrackers[0];
						}
						
						res.json(result);
						
					} else {
						
						res.json(result);
						
					}
					
				} else {
					
					res.json(result);
					
				}
				
				
			});
			
		});
		
    }

    };

    return module.exports;
	
};
