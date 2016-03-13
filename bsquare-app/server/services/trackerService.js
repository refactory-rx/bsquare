import Q from "q";
import url from "url";
import uuid from "node-uuid";

let responseUtil = require("../utils/responseUtil");
let RefTracker, ImpressionTracker, Order, Ticket, Event;

class TrackerService {

  constructor(app) {
    ({ RefTracker, ImpressionTracker, Order, Ticket, Event } = app.model);
    this.app = app;
    this.authService = app.authService;
  }

  getRefTracker(params) {

    let deferred = Q.defer();

    let query;

    if (params.refTrackerId) {
      query = { uuid: params.refTrackerId };
    } else if (params.userId && params.eventId) {
      query = { userId: params.userId, eventId: params.eventId };
    }

    console.log("Get reftracker with params", params);
    if (query) {

      RefTracker.findOne(query, (err, refTracker) => {

        if (err) { return deferred.reject(err); }

        if (!refTracker) {

          refTracker = {
            eventId: params.eventId
          };

          if (query.uuid) {
            refTracker.uuid = query.uuid;
          } else {
            refTracker.userId = query.userId;
            refTracker.uuid = uuid.v1();
          }

          console.log("Creating reftracker", refTracker);
          RefTracker.create(refTracker, (err, refTracker) => {

            console.log("Created reftracker", err, refTracker);
            if (err) { return deferred.reject(err); }
            deferred.resolve(refTracker);

          });

          return;

        }

        deferred.resolve(refTracker);

      });

    } else {

      setTimeout(() => {

        let refTracker = {
          uuid: uuid.v1(),
          eventId: params.eventId
        };

        deferred.resolve(refTracker)

      });

    }

    return deferred.promise;

  }
  
  getGroupRewards(refTrackerUuid) {
      
    const deferred = Q.defer();

    RefTracker.findOne({ uuid: refTrackerUuid }, (err, refTracker) => {
      
      if (err) { return deferred.reject(err); }
      if (!refTracker) {
        return deferred.resolve({});
      }

      this.getOrdersByTracker(refTracker.eventId, refTracker.uuid, 
                              (event, orders) => {
        let rewardStats = this.compileRewardStats(event, orders);
        deferred.resolve(rewardStats);
      });

    });

    return deferred.promise;

  }

  getAvailableRefRewards(user) {
    
    return new Promise((resolve, reject) => {
      
      RefTracker.findQ({ userId: user.id })
      .then(refTrackers => {
        
        const trackerIds = refTrackers.map(tracker => tracker.uuid);
        const earnedQuery = Order.aggregate([
          { 
            $match: {
              user: { $ne: user.id },
              refTrackerId: { $in: trackerIds }, 
              status: "fulfilled" 
            }
          },
          {
            $group: {
              _id: null,
              earned: { $sum: "$orderTotal" }
            }
          }
        ]).execQ();
        
        const spentQuery = Order.aggregate([
          { 
            $match: {
              user: user.id,
              status: "fulfilled" 
            }
          },
          {
            $group: {
              _id: null,
              used: { $sum: "$rewardUsed" }
            }
          }
        ]).execQ();
        
        const rewardsAvailable = {}; 
        Q.all([earnedQuery, spentQuery])
        .then(results => {
          console.log("aggr results", results);
          results.forEach(result => Object.assign(rewardsAvailable, result[0]));
          delete rewardsAvailable._id;
          rewardsAvailable.earned = rewardsAvailable.earned || 0;
          rewardsAvailable.used = rewardsAvailable.used || 0;
          resolve(rewardsAvailable);
        })
        .catch(err => reject(err));

      })
      .catch(err => {
        reject(err);
      });
    
    });

  }

  getRefRewards(user) {
    
    const deferred = Q.defer();

    RefTracker.find({ userId: user.id }, (err, refTrackers) => {
      
      //console.log("found trackers", err, refTrackers);
      const orderQueries = refTrackers.map(tracker => {
        return Order.findQ({ 
          refTrackerId: tracker.uuid, 
          status: "fulfilled",
          user: { $ne: user.id } 
        });
      });
      
      const refRewardsByEvent = {};
      
      Q.all(orderQueries)
      .then((orders) => {
        
        //console.log("found orders", orders);
        orders.forEach(orders => {
          orders.forEach(order => {

            let rewards = refRewardsByEvent[order.event];
            if (!rewards) {
              rewards = {
                total: 0,
                ticketCount: 0,
                eventName: order.tickets[0].eventName,
                tickets: {}
              };
              refRewardsByEvent[order.event] = rewards;
            }
            
            order.items.forEach(item => {
              
              let ticketStats = rewards.tickets[item.ticketResource];
              if (!ticketStats) {
                ticketStats = {
                  total: 0,
                  ticketName: item.name
                };
                rewards.tickets[item.ticketResource] = ticketStats;
              }

              ticketStats.total += item.price * item.quantity;
              rewards.ticketCount += item.quantity;

            });

            rewards.total += order.orderTotal;
          
          });
        });
        
        console.log("ref rewards", refRewardsByEvent);
        deferred.resolve({ refRewards: refRewardsByEvent });  
      
      });

    });

    return deferred.promise;
  
  }

  getRewardStatsByTracker(refTrackerUuid, user) {

    let deferred = Q.defer();
      
    this.getGroupRewards(refTrackerUuid)
    .then(groupRewards => {
        
      if (!user) {
        return deferred.resolve(groupRewards);
      }

      this.getRefRewards(user)
      .then(refRewards => {
        deferred.resolve(Object.assign(refRewards, groupRewards));
      });

    }); 
      
    return deferred.promise;

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
        
	    orders.forEach(order => {

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
        
        let deferred = Q.defer();

		console.log(`addRewardToTickets(${reward.name}): orders.length=${orders.length}`);

        orders.forEach(order => {

			let rewardsAdded = false;
            let ticketUpdates = [];
            order.tickets.forEach(ticket => {
				if(ticket.ticketResourceId === ticketResourceId) {
					ticketUpdates.push(this.updateTicketWithReward(order, ticket, reward));
					rewardsAdded = true;
				}
			});
            
            if(rewardsAdded) {
                let updateOrder = Order.updateQ({ _id: order._id }, { tickets: order.tickets });
				ticketUpdates.push(updateOrder);
            }

            Q.all(ticketUpdates)
            .then(() => {
                deferred.resolve();
            })
            .catch((err) => {
                deferred.reject(err);
            });
                
            console.log("order "+order._id+" add="+rewardsAdded);


        });

        return deferred.promise;

	}

	updateTicketWithReward(order, ticket, reward) {
        
        let deferred = Q.defer();

		if(!ticket.rewards) {
			ticket.rewards = [];
		}

        ticket.rewards.push(reward);
        
        Ticket.findOne({ _id: ticket._id }, (err, ticket) => {
			if(err) {
                console.log(err);
                deferred.reject(err);
			} else {
                console.log(`updated ${ticket._id} with (${reward.name})`);
                ticket.rewards.push(reward);
                ticket.save();
                deferred.resolve();
			}
        });
        
        return deferred.promise;

	}

	detectGroupRewardConditions(event, orders, newOrder) {

		//console.log("detectRewardConditions, orders.length="+orders.length);

		let groupRewards = event.groupRewards;
    if (!groupRewards) {
      console.log("Event does not have group rewards");
      return;
    }

		let origQtysMap = this.createTicketResourceMap(orders, newOrder);
		let newQtysMap = this.createTicketResourceMap(orders);
        
    let addRewardsPromises = [];
    groupRewards.conditions.forEach(rewardCondition => {

			let ticketResourceId = rewardCondition.ticketResource._id;
			let qtyBefore = origQtysMap[ticketResourceId];
			let qtyAfter = newQtysMap[ticketResourceId];

			if(qtyAfter && qtyAfter >= rewardCondition.quantity) {
				if(!qtyBefore || qtyBefore < rewardCondition.quantity) {
                    // Add to all tickets
                    console.log(`add [${rewardCondition.reward.name}] to all orders`);
					addRewardsPromises.push(this.addRewardToTickets(orders, ticketResourceId, rewardCondition.reward));
				} else {
					// Add to new tickets
                    console.log(`add [${rewardCondition.reward.name}] to new order`);
					addRewardsPromises.push(this.addRewardToTickets([newOrder], ticketResourceId, rewardCondition.reward));
				}
			}

        });

        Q.all(addRewardsPromises)
        .then(() => {
            console.log("Finished adding rewards to tickets");
        })
        .catch((err) => {
            console.log("Error", err);
        });

    }

	compileRewardStats(event, orders) {

        if (event.groupRewards) {
            let qtysMap = this.createTicketResourceMap(orders);
            event.groupRewards.conditions.forEach(rewardCondition => {
                rewardCondition.reached = qtysMap[rewardCondition.ticketResource._id];
            });
        }

        return {
            groupRewards: event.groupRewards
        };

    }

	checkGroupTrackingRules(newOrder) {

        this.getOrdersByTracker(newOrder.event, newOrder.refTrackerId, (event, orders) => {
			this.detectGroupRewardConditions(event, orders, newOrder);
		});

	}

	getOrdersByTracker(eventId, refTrackerId, callback) {

		let response = {};

		if(!refTrackerId) {
			return { "error": "missingTrackerId" };
		}

        Event.findOne( { _id: eventId }, (err, event) => {

            Order.find({ refTrackerId: refTrackerId }, (err, orders) => {
                callback(event, orders);
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
