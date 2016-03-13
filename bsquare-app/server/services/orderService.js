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

	getOrder(req, id) {
    
    return new Promise((resolve, reject) => {
      
      this.authService.screenRequest(req, true, (result) => {
        this.getOrderByParams({ _id: id }, (response) => {
          if (response.error) {
            return reject(response);
          }
          resolve(response);
        });
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

  sendOrderEmail(order, language) {
    return new Promise((resolve, reject) => {
    
      //translations[req.headers["bsquare-language"]].orderEmail;
      let orderLink = APP_BASE_URL+"/#/order/"+order._id;
      let emailContent = 
        translations[language].orderEmail;
      emailContent = emailContent.replace(/{orderLink}/g, orderLink);
                                                            
      this.app.mailer.sendMail({
        to: order.signupFields[0].value,
        subject: "[B^2] Order created",
        html: emailContent,
        text: emailContent
      }, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
      
    });
  }

  _updateOrder(order, language) {

    return new Promise((resolve, reject) => {
      
      order.saveQ()
      .then(order => {
      
        console.log("UPDATED ORDER", order);
        if(order.signupStatus === "complete" &&
          order.status !== "orderFulfilled") {
          
          this.sendOrderEmail(order, language);
                        
          if(order.orderTotal === 0 || order.orderTotal > 300) {
            this.fulfillOrder(order._id, (response) => {
              if (response.error) return reject(response);
              resolve(response);
            });
          } else {
            resolve(order);
          }

        } else {
          resolve(order);
        }

      })
      .catch(err => {
        reject(err);
      });

    });

  }

  _rewardSufficient(order, user) {
    return new Promise((resolve, reject) => {
      
      console.log("START AVAIL CHECK ____________--------------!!!!!!!!!!!!"); 
      
      this.trackerService.getAvailableRefRewards(user)
      .then(result => {
        
        console.log("avail result", result);
        if (result.earned - result.used < order.rewardUsed) {
          return reject({ message: "reward_amount_check_failed" });
        }

        resolve();
      
      })
      .catch(err => {
        console.log("avail err", err);
        reject(err);
      });
    });
  
  }
  
  _updateExistingOrder(order, user, language) {
    return new Promise((resolve, reject) => {
      
      Order.findOneQ({ _id: order._id })
      .then((existingOrder) => {
        
        if (!existingOrder) {
          return reject({ message: "order_not_found" });
        }

        if (order.signupStatus === "formFilled") {
          order.signupStatus = "complete";
        }
        
        if (user && order.rewardUsed && order.rewardUsed > 0) { 
          
          this._rewardSufficient(order, user)
          .then(() => {
          
            order.orderTotal -= order.rewardUsed;
            Object.assign(existingOrder, order);
            console.log("final order", existingOrder);
            this._updateOrder(existingOrder, language)
            .then(order => resolve(order))
            .catch(err => reject(err));

          })
          .catch(err => reject(err));          

        }

        Object.assign(existingOrder, order);
        this._updateOrder(existingOrder, language)
        .then(order => resolve(order))
        .catch(err => reject(err));

      })
      .catch(err => {
        reject(err);
      });
      
    });

  }

  _getOrderTotal(itemIds, qtyById) {
    return new Promise((resolve, reject) => {
      
      let orderTotal = 0;

      TicketResource.find( { _id: { $in: itemIds } }, (err, ticketResources) => {

        if (err) return reject(err);

        if (ticketResources.length != itemIds.length) {
          return reject({ message: "invalid_items" });
        }

        for (let i = 0; i < ticketResources.length; i++) {

          let idString = ticketResources[i]._id.toHexString();

          if(qtyById[idString] > ticketResources[i].qtyAvailable - ticketResources[i].qtyReserved) {
            return reject({
              status: "soldOut",
              message: `There are not enough tickets of type ${ticketResources[i].name} to satisfy this order.`,
              ticketResource: idString
            });
          }

          orderTotal += ticketResources[i].price * qtyById[idString];

        }
        
        resolve({ orderTotal, ticketResources });
      
      });

    });
    
  }

  _updateQtys(ticketResources, qtyById) {
    
    let qtyUpdates = ticketResources.map(ticketResource => {

      return (() => {

        let deferred = Q.defer();

        let idString = ticketResource._id.toHexString();
        let qtyReserved = ticketResource.qtyReserved + 
          qtyById[idString];

        console.log("qtyById / qtyReserved", 
                    ticketResource.qtyReserved, 
                    qtyById, qtyReserved);

        TicketResource.update({ _id: ticketResource._id }, 
                              { qtyReserved: qtyReserved }, 
                              (err, numAffected) => {
          deferred.resolve(numAffected);
        });

        return deferred.promise;

      })();

    });

    Q.all(qtyUpdates)
    .then((updateResults) => {
      console.log('qty update results', updateResults);
    });
  
  }
  
  _createNewOrder(order, user) {

    return new Promise(async (resolve, reject) => {

      try {
        
        order.timePlaced = (new Date()).getTime();
        order.user = user.id;

        let items = order.items;
        let itemIds = [];
        let qtyById = [];

        for(let i = 0; i < items.length; i++) {
          let itemId = items[i].ticketResource;
          itemIds.push(itemId);
          qtyById[items[i].ticketResource] = parseInt(items[i].quantity);
        }

        const result = await this._getOrderTotal(itemIds, qtyById);
        order.orderTotal = result.orderTotal;
        
        const event = await Event.findOne({ _id: order.event }).exec();

        if(!event.signupFields || event.signupFields.length === 0) {
          order.signupStatus = "complete";
        }

        order.status = "new";

        order = await Order.create(order);
        this._updateQtys(result.ticketResources, qtyById);
        this.updateOrderMap(order, result.ticketResources);
                              
        if(order.signupStatus === "complete") {
                  
          if(result.orderTotal === 0 || result.orderTotal > 300) {
            this.fulfillOrder(order._id.toHexString(), 
                              (response) => {
              if (response.error) return reject(response.error);
              resolve(response.order);
            });
          } else {
            resolve(order);
          }

        } else {
          resolve(order);
        }

      } catch (err) {
        reject(err);
      }

    });
  
  }

	saveOrder(order, user, language) {
    
    console.log("saving order", order);  
    return new Promise(async (resolve, reject) => { 
      
      try {
        
        if (order._id) {
          order = await this._updateExistingOrder(order, user, language);
        } else {
          order = await this._createNewOrder(order, user)
        }
        
        resolve(order);

      } catch (err) {
        reject(err);
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

	async fulfillOrder(orderId, callback) {
    
    console.log("fulfilling order...");

    try {

      let response = {
        success: 0,
        status: "none"
      };
          
      let order = await Order.findOne( { _id: orderId }).exec();
      if (!order) {
        return callback({ error: "not_found" });
      }

      let items = order.items;
      let itemIds = [];
      let qtyById = {};

      for(let i=0; i < items.length; i++) {
        let itemId = items[i].ticketResource;
        itemIds.push(itemId);
        qtyById[items[i].ticketResource] = items[i].quantity;
      }
                      
      const ticketResources = 
        await TicketResource.find( { _id: { $in: itemIds } }).exec();

      let params = Object.assign({
          orderId: order._id.toString(),
          qtysByResource: qtyById
      }, order.user ? { userId: order.user.toString() } : {});

      this.ticketService.createTickets(params, async (result) => {
        
        console.log("CREATE TICKETS RESULT", result);
        if(result.success === 0) {

          callback(result);

        } else if(result.status === "orderFulfilled") {
        
          const tickets = 
            await Ticket.find( { orderId: order._id.toHexString() }).exec();
          console.log("found tickets", tickets);
          order.status = "fulfilled";
          order.tickets = tickets;
          order = await order.save();
          
          console.log("NUM AFF", order);
          order.tickets = tickets;
          this.trackerService.checkGroupTrackingRules(order);
          response.status = "orderFulfilled";
          response.message = "Order fulfilled.";
          response.order = order;
          response.tickets = tickets;

          callback(response);
        
        }

      });

    } catch (err) {
      console.log("fulfillment error", err);
      callback({ error: err });
    }

	}
    
  initRoutes() {
      let orderServiceRoutes = require("./orderServiceRoutes");
      orderServiceRoutes.init(this.app);
  }

}

module.exports = (app) => {
    return new OrderService(app);
};
