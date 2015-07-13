let Q = require('q');
let fs = require('fs');
let url = require('url');
let crypto = require('crypto');
let merge = require('merge');

let mailUtil = require('../utils/mailUtil');
let httpUtil = require('../utils/httpUtil');

let Event, ImpressionTracker, TicketResource, Ticket;
let WEB_CONTENT_PATH;

class EventService {
    
    constructor(app) {
        ({ Event, ImpressionTracker, TicketResource, Ticket } = app.model);
        ({ WEB_CONTENT_PATH } = app.settings);
        this.app = app;
        this.authService = app.authService;
    }

	getEvents(params, callback) {	
        
        let deferred = Q.defer();    
        Event.find(params, (err, events) => {
            if (err) {
                return deferred.reject(err);
            }
            deferred.resolve(events);
        });

        return deferred.promise;

    }
	
	getPromoEvents() {
        
        let deferred = Q.defer();
         
        let params = {
            "info.timeEnd": {
                $gt: (new Date()).getTime()
            }
		};
		
        Event.find(params, (err, events) => {
            if (err) {
                return deferred.reject(err);
            }
            deferred.resolve(events);
        });

        return deferred.promise;
		
	}
		
	searchEventsByText(searchText, callback) {
		
		let response = {
			success: 0,
			status: 'none'
		};
		
		//console.log('events params:');
		//console.log(params);
		
		let conditions = [ { 'info.title': new RegExp(searchText, 'i') } ];
		
		if(searchText && searchText.length > 3) {
			conditions.push({ 'info.description': new RegExp(searchText, 'i') });
			conditions.push({ 'info.place.address': new RegExp(searchText, 'i') });
		}
		
        Event.find({ $or: conditions }, (err, events) => {
			
    		if(err) {
				
				response.status = 'error';
				response.message = 'Error reading data.';
				response.error = err;
			
			} else {
				
				if(events) {
					response.success = 1;
					response.status = 'eventsFound';
					response.events = events;
				} else {
					response.status = 'eventsNotFound';
					response.message = 'Events not found.';
				}
			}
			
			callback(response);
			
		
		});
		
		
	}
	
	getEvent(params, callback) {
		
		let response = {
			success: 0,
			status: 'none'
		};

        let tracking = params.tracking; 
        if (tracking) {
            delete params.tracking;
        }

        this.getEventByParams(params, (response) => {
		    
			let impressionParams = {};
			let refTrackerId = tracking.group || tracking.ref;
            
            if (refTrackerId) {
				impressionParams.refTrackerId = refTrackerId;
			}

            if (tracking.user) {
                
                impressionParams.userId = tracking.user.id;
                if(response.event) {
                    if(response.event.user.equals(tracking.user.id)) {
                        response.ownEvent = 'true';
                    }
                }

            } else {
                
                let fwd = (tracking.fwd || '').split(',')[0];
                let remoteIp = fwd || tracking.remoteIp;
                impressionParams.remoteIp = remoteIp;
            
            }
                
            this.updateEventImpressions(params._id, impressionParams);
            callback(response);
				
				
		});
		
	}
    
	updateEventImpressions(eventId, impressionParams) {
		
		let findParams = {
			viewType: 'event',
			entityId: eventId
		};
		
		findParams = merge(findParams, impressionParams);
		
        ImpressionTracker.find(findParams, (err, impressionTrackers) => {
				
			if(err) {
				//console.log(err);
			} else {
				
				//console.log('found ' + impressionTrackers.length + ' impr trackers for event ' + eventId);
				
				if(impressionTrackers && impressionTrackers.length === 0) {
				
					findParams.count = 0;
                    ImpressionTracker.create(findParams, (err, savedImpressionTracker) => {
						if (err) {
							//console.log(err);
						}
					});
				
					
				} else {
					
					let impressionTracker = impressionTrackers[0];
					ImpressionTracker.update(
						{ _id: impressionTracker._id }, 
						{ count: impressionTracker.count + 1 },
                        (err, numAffected) => {
							if(err) {
								//console.log(err);
							} else {
								//console.log('increased counter to ' + (impressionTracker.count + 1) + ' for imprtracker:');
								//console.log(impressionTracker);
							}
						});
				
					
				}
			
				
			}
		
			
		});
	
		
	}
	
	getEventByParams(params, callback) {
		
		let response = {
			success: 0,
			status: "none"
		};
	    	
		let queryParams = { _id: params._id } ? params._id : params;
		
        Event.findOne(queryParams, (err, event) => {
			
			if(err) {
				response.status = "error";
				response.message = "Error reading data.";
				response.error = err;
				callback(response);
			} else {
				if(event) {
					response.success = 1;
					response.status = "eventFound";
					response.event = event;
					callback(response);
				} else {
					response.status = "eventNotFound";
					response.message = "Event not found.";
					callback(response);
				}
			}
		});
		
	}
	
	saveEvent(req, callback) {
		
        this.authService.screenRequest(req, true, (result) => {
			
			if(result.status === "authorized") {
				
				let response = {
					success: 0,
					status: "none"
				};
				
				let saveEventRequest = req.body;
				let event = saveEventRequest.event;
				let eventId = event._id;
				//console.log(event);
				delete event._id;
				
				if(eventId && eventId !== "new") {
					
					delete event._id;
					
                    Event.update({ _id: eventId }, event, (err, numAffected) => {
						
						if(err) {
							response.status = "error";
							response.message = "Failed to save event.";
							response.error = err;
						} else {
							response.success = 1;
							response.status = "eventSaved";
							response.message = "Event saved.";
						}
						
						callback(response);
					});
					
				} else {
					
					event.user = result.user.id;
					
					let emailSignupField = {
						type: {
							name: "email",
							title: "E-mail"
						},
						name: "email",
						title: "E-mail",
						required: "true"
					};
					
					event.signupFields = [emailSignupField];
                    let eventName = event.info.title.toLowerCase();
                    event.slug = eventName.split(" ").join("-");
                    console.log(`generated event slug: ${event.slug}`);

                    Event.create(event, (err, createdEvent) => {
						if(err) {
							response.status = "error";
							response.message = "Failed to create event.";
							response.error = err;
						} else {
							response.success = 1;
							response.status = "eventCreated";
							response.message = "Event created.";
							response.event = createdEvent;
						}
						callback(response);
					
					});
					
				}
				
			} else {
				
				callback(result);
			
			}
			
		});
		
	}
	
	getTicketResources(req, callback) {
		
		let url_parts = url.parse(req.url, true);
		let params = url_parts.query;
		let kind = params.kind;
		let eventId = req.params.eventId;
		let objId = eventId;
		params.event = objId;
		
		let response = { success: 0 };
		
        this.authService.screenRequest(req, true, (result) => {
			
			this.getTicketResourceQueryParams(eventId, result)
            .then((params) => {
				
				console.log(params);
				
				return TicketResource.findQ(params);
				
			})
            .then((ticketResources) => {
				
				ticketResources = JSON.parse(JSON.stringify(ticketResources));
				
				let now = (new Date()).getTime() + 60000;
				
				for(let i=0; i < ticketResources.length; i++) {
					
					let salesStart = ticketResources[i].salesStart;
					let salesEnd = ticketResources[i].salesEnd;
					console.log(ticketResources[i].name, ticketResources[i].isPublic);
					console.log(salesStart, now, salesEnd, (salesStart > now), (salesEnd < now));
					
					if(salesStart > now || salesEnd < now || ticketResources[i].isPublic == false) {
						ticketResources[i].visibility = "hidden";
					} else {
						ticketResources[i].visibility = "visible";
					}
					
					console.log(`undeletable = ${(salesStart < now)}`);
					if(salesStart < now) {
						ticketResources[i].status = "undeletable";
					}
					
				}
								
				response.success = 1;
				response.status = "ticketResourcesFound";
				response.message = "Ticket resources found.";
				response.ticketResources = ticketResources;
					
				callback(response);
									
			})
            .catch((error) => {
				
				console.log(error);
				
				response.status = "errorFetchingTicketResources";
				response.error = error.message;
				
				callback(response);
				
			});
			
		});
		
	}
	
	getTicketResourceQueryParams(eventId, authResult) {
		
		let deferred = Q.defer();
		
		let now = (new Date()).getTime();
		let params = { 
			
			event: eventId,
			
			$and: [
				{ salesStart: { $lte: now } },
				{ salesEnd: { $gte: now } },
				{ isPublic: true }
			]
	
		};
		
		if(authResult.status === "authorized") {
			
			Event.findOneQ({ _id: eventId })
            .then((event) => {
				
				console.log(event.user.toHexString()+'/'+authResult.user.id.toHexString());
				
				if(event && event.user.toHexString() == authResult.user.id.toHexString()) {
				 	delete params.$and;
					deferred.resolve(params);
				} else {
					deferred.resolve(params);
				}
				
			})
            .catch((error) => {
				deferred.reject(error);	
			});
				
		} else {
			
            setTimeout(() => {
				deferred.resolve(params);
			}, 100);
			
		}
		
		return deferred.promise;
		
			
	}
	
	saveTicketResource(req, callback) {
		
        this.authService.screenRequest(req, true, (result) => {
			
			if(result.status == 'authorized') {
				
				let response = {
					success: 0,
					status: 'none'
				};
				
				let saveTicketResourceRequest = req.body;
				let ticketResource = saveTicketResourceRequest.ticketResource;
				let ticketResourceId = ticketResource._id;
				let event = ticketResource.event;
				let createEvent = false;
				
				if(event._id && event._id != 'new') {
					ticketResource.event = event._id;
				}
				else {
					createEvent = true;
				}
				
				//console.log(ticketResource);
				delete ticketResource._id;
				ticketResource.eventName = event.info.title;
				ticketResource.eventPlace = event.info.place;
				ticketResource.eventStarts = event.info.timeStart;
				
				if(ticketResourceId && ticketResourceId != 'new') {
					
					TicketResource.findOneQ({ _id: ticketResourceId })
                    .then((existingTicketResource) => {
						
						Ticket.find( { ticketResourceId: ticketResourceId }).count()
						.execQ()
                        .then((ticketCount) => {
							
							console.log('saving tktrsrc, tky count = '+ticketCount);
							
							ticketResource.qtyAvailable = ticketResource.quantity - ticketCount;
							
							//console.log(ticketResource);
							
                            TicketResource.update({ _id: ticketResourceId }, ticketResource, (err, numAffected) => {
								
								console.log('updated', numAffected);
								
								if(err) {
									response.status = 'error';
									response.message = 'Failed to save ticket resource.';
									response.error = err;
									//console.log(err);
								} else {
									response.success = 1;
									response.status = 'ticketResourceSaved';
									response.message = 'Ticket resource saved.';
								}
								
								callback(response);
						
							});
							
								
						})
                        .catch((error) => {
							console.log(error);	
						});
								
					})
                    .catch((error) => {
						console.log(error);	
					});
					
					
				} else {
					
					ticketResource.qtySold = 0;
					ticketResource.qtyReserved = 0;
					ticketResource.qtyAvailable = ticketResource.quantity;
					
					if(createEvent === true) {
						
						delete event._id;
						delete ticketResource.event;
						event.user = result.user.id;
						
                        Event.create(event, (err, createdEvent) => {
							
							if(err) {
								
								response.status = 'error';
								response.message = 'Failed to create event.';
								response.error = err;
							
							} else {
								
								response.event = createdEvent;
								ticketResource.event = createdEvent._id;
								
                                TicketResource.create(ticketResource, (err, createdTicketResource) => {
									
									if(err) {
										response.status = 'error';
										response.message = 'Failed to create ticket resource.';
										response.error = err;
									} else {
										response.success = 1;
										response.status = 'ticketResourceCreated';
										response.message = 'Ticket resource created.';
										response.ticketResource = createdTicketResource;
									}
									
									callback(response);
									
								});
								
							}
							
						});
						
					} else {
						
                        TicketResource.create(ticketResource, (err, createdTicketResource) => {
							
							if(err) {
								response.status = 'error';
								response.message = 'Failed to create ticket resource.';
								response.error = err;
							} else {
								response.success = 1;
								response.status = 'ticketResourceCreated';
								response.message = 'Ticket resource created.';
								response.ticketResource = createdTicketResource;
							}
							
							callback(response);
						
						});
						
					}
				}
			}
			else {
				callback(result);
			}
		});
    
    }
	
	deleteTicketResource(id) {
		
		let deferred = Q.defer();
		
		let response = { success: 0 };
		
		TicketResource.findOneQ({ _id: id })
        .then((ticketResource) => {
			
			Event.findOneQ({ _id: ticketResource.event })
            .then((event) => {
				this.fixMarketingRules(event, id);
			})
            .catch((error) => {
				console.log(error);
			});
			
			return TicketResource.removeQ({ _id: id })
			
		})
        .then((numRemoved) => {
			
			if(numRemoved == 1) {
				
				response.success = 1;
				response.status = 'ticketResourceDeleted';
				
			} else {
				response.status = 'ticketResourceNotFound';
			}
			
			deferred.resolve(response);
			
		})
        .catch((error) => {
			console.log(error);
			response.status = 'errorDeletingTicketResource';
			response.message = 'Error deleting ticket resource.';
			response.error = error.message;
			deferred.resolve(response);
		});
		
		return deferred.promise;
			
	}
	
	fixMarketingRules(event, deletedTicketResourceId) {
		
		let refRewards = event.refRewards;
		let groupRewards = event.groupRewards;
		
		console.log(refRewards);
		console.log(groupRewards);
		
		let remainingGroupRewardConditions = [];
		for(let i=0; i < groupRewards.conditions.length; i++) {
			if(groupRewards.conditions[i].ticketResource._id != deletedTicketResourceId) {
				remainingGroupRewardConditions.push(groupRewards.conditions[i]);
			}	
		}
		
		groupRewards.conditions = remainingGroupRewardConditions;
		
		let remainingRefRewardConditions = [];
		for(let i=0; i < refRewards.conditions.length; i++) {
			if(!refRewards.conditions[i].ticketResource || refRewards.conditions[i].ticketResource._id != deletedTicketResourceId) {
				remainingRefRewardConditions.push(refRewards.conditions[i]);
			}
		}
		
		refRewards.conditions = remainingRefRewardConditions;
		
        Event.update( { _id: event._id }, { refRewards: refRewards, groupRewards: groupRewards }, (err, numAffected) => {
			console.log('updated event conditions for '+numAffected+' event');	
		});
		
	}
	
	bundleProduct(req, callback) {
		
        this.authService.screenRequest(req, true, (result) => {
			if (result.status == 'authorized') {
				let response = {
					success: 0,
					status: 'none'
				};
				let bundleProductRequest = req.body;
				let eventId = bundleProductRequest.eventId;
				let productUrl = bundleProductRequest.productUrl;
				Event.find({
						_id: eventId
					}, (err, event) => {
						if (err) {
							response.status = 'error';
							response.message = 'Could not read event data.';
							response.error = err;
							callback(response);
						} else {
							if (event) {
                                httpUtil.httpGet(productUrl, (httpResponse) => {
									if (httpResponse.success == 1) {
										let data = httpResponse.data;
										if (data) {
											let startIndex = data.indexOf('og:image');
											let endIndex = startIndex + 256;
											if (startIndex > 0) {
												let imageUrl = data.substring(startIndex, endIndex);
												startIndex = imageUrl.indexOf('content') + 9;
												imageUrl = imageUrl.substring(startIndex);
												imageUrl = imageUrl.substring(0, imageUrl.indexOf('"'));
												let bundledProducts = event.bundledProducts;
												let product = {
													productUrl: productUrl,
													imageUrl: imageUrl
												};
												response.success = 1;
												response.status = 'productBundled';
												response.message = 'Product bundled.';
												response.product = product;
												callback(response);
											}
											else {
												response.status = 'invalidPage';
												response.message = 'Invalid product page format.';
												callback(response);
											}
										}
										else {
											response.status = 'noData';
											response.message = 'Product page content unavailable.';
											callback(response);
										}
									}
									else {
										response.status = 'pageNotLoaded';
										response.message = 'Could not load product page.';
										response.error = httpResponse.data;
										callback(response);
									}
								});
							}
							else {
								response.status = 'eventNotFound';
								response.message = 'Event not found.';
								callback(response);
							}
						}
					}
				);
			}
		});
    
    }
	
	saveFile(req, callback) {
		
		let response = {
			success: 0,
			status: 'none'
		};
		
		let eventId = req.params.id;
		//console.log(__dirname);
		
		req.pipe(req.busboy);
        req.busboy.on('file', (fieldname, file, origFilename) => {
    		
    		let extIndex = (origFilename.length - 5) + origFilename.substring(origFilename.length - 5).indexOf('.');
			let extension = origFilename.substring(extIndex);
			let urlPath = '/events/'+eventId+'_img'+extension;
  			let filePath = WEB_CONTENT_PATH + '/img' + urlPath;
  			
  			//console.log('create write stream to '+filePath);
    		let fstream = fs.createWriteStream(filePath);
    		
    		//console.log('pipe file');
        	file.pipe(fstream);
        	
            fstream.on('close', () => {
        		
        		//console.log('update event');
                Event.update( { _id: eventId }, { 'info.eventImage': urlPath }, (err, numAffected) => {
	    			
	    			response.success = 1;
	    			response.status = 'eventImageSaved';
	    			response.eventImage = urlPath;
	    			callback(response);
	    					
	    		});
	    			
        	});
        	
    	});	
		
    }

    initRoutes() {
        let eventServiceRoutes = require("./eventServiceRoutes");
        eventServiceRoutes.init(this.app);
    }
	
}

module.exports = (app) => {
    return new EventService(app);
};
