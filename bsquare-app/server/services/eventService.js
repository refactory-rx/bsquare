import Q from "q";
import fs from "fs";
import url from "url";
import crypto from "crypto";
import merge from "merge";
import IBAN from "iban";

let mailUtil = require('../utils/mailUtil');
let httpUtil = require('../utils/httpUtil');
let Errors = require("../../../shared/lib/Errors");

let Event, ImpressionTracker, TicketResource, Ticket;
let WEB_CONTENT_PATH;

const PLACE_MAP = {
    "Helsingfors": "Helsinki",
    "Tammerfors": "Tampere",
    "Åbo": "Turku",
    "Uleåborg": "Oulu",
    "Esbo": "Espoo",
    "Vanda": "Vantaa",
    "Tavastehus": "Hämeenlinna",
    "Lahtis": "Lahti",
    "Villmanstrand": "Lappeenranta",
    "Björneborg": "Pori",
    "Nyslott": "Savonlinna",
    "Vasa": "Vaasa",
    "Torneå": "Tornio",
    "Hangö": "Hanko"
};

class EventService {
    
  constructor(app) {
      
    ({ Event, ImpressionTracker, TicketResource, Ticket } = app.model);
    ({ WEB_CONTENT_PATH } = app.settings);
    
    this.app = app;
    this.authService = app.authService;
  
  }

	getEvents(params) {	
        
    let deferred = Q.defer();    
    Event.find(params, (err, events) => {
      if (err) {
        return deferred.reject(err);
      }
      deferred.resolve(events);
    });

    return deferred.promise;

  }
    
  getEventStats() {	
        
    let deferred = Q.defer();    
    Event.find({}, (err, events) => {
            
      if (err) {
        return deferred.reject(err);
      }
            
      let locations = { max: 0 };
      let types = { max: 0 };
      events.forEach(event => {
          
        let vicinity = event.info.place.vicinity;
        let city = PLACE_MAP[vicinity] || vicinity;
        
        locations[city] = locations[city] ? locations[city] + 1 : 1;
        if (locations[city] > locations.max) {
          locations.max = locations[city];
        }

        let type = event.info.type;
        if (type) {
          types[type] = types[type] ? types[type] + 1 : 1;
          if (types[type] > types.max) {
            types.max = types[type];
          }
        }

      });

      deferred.resolve({
        locations: locations,
        types: types
      });

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
    
    _createSearchConditions(searchString) {
        return [
            { "info.title": new RegExp(searchString, "i") },
            { "info.description": new RegExp(searchString, "i") },
            { "info.place.address": new RegExp(searchString, "i") }
        ];
    }

	searchEventsByText(searchText, filters) {
		
        let deferred = Q.defer();
            
		let filterConditions = [];
		let searchConditions = [];
        
        if (filters) {
            
            if (filters["type"]) {
                filterConditions.push({ "info.type": filters["type"] });
            }
             
            if (filters["time"]) {
                
                let time = filters["time"];
                let now = (new Date()).getTime();
                let until = 1000 * 60 * 60 * 24;
                if (time === "week") {
                    until = until * 7;
                } else if (time === "month") {
                    until = until * 31;
                }

                filterConditions.push({
                    "$and": [
                        { "info.timeEnd": { "$gt": now } },
                        { "info.timeStart": { "$lt": now + until } }
                    ]
                });
            
            }
            
            if (filters["location"]) {
                let filterSearchConditions = this._createSearchConditions(filters["location"]);
                filterConditions.push({ "$or": filterSearchConditions });
            }

        }
	
		if(searchText && searchText.length > 3) {
            let querySearchConditions = this._createSearchConditions(searchText);
            searchConditions = searchConditions.concat(querySearchConditions);
        }

        let query = {};
        if (searchConditions.length > 0) {
            query["$or"] = searchConditions;
        }

        if (filterConditions.length > 0) {
            query["$and"] = filterConditions;
        }

        Event.findQ(query)
        .then((events) => {
            deferred.resolve(events);
        })
        .catch((err) => {
            deferred.reject(err);
        });

        return deferred.promise;
		
	}
	
	getEvent(id) {
        
    let deferred = Q.defer();

    Event.findOneQ({ _id: id })
    .then((event) => {
            
      if (!event) {
        return deferred.reject(
          new Errors.NotFound(null, { message: "event_not_found" })
        );
      }

      deferred.resolve(event);
        
    })
    .catch((err) => {
      deferred.reject(err);
    });

    return deferred.promise;
		
	}
    
	updateImpressions(eventId, tracking) {
		
    let params = {
      viewType: "event",
      entityId: eventId
    };

    let refTrackerId = tracking.ref;
        
    if (refTrackerId) {
      params.refTrackerId = refTrackerId;
    }

    if (tracking.user) {
      params.userId = tracking.user.id;
    } else {
      let fwd = (tracking.fwd || '').split(',')[0];
      let remoteIp = fwd || tracking.remoteIp;
      params.remoteIp = remoteIp;
    }
        	
    ImpressionTracker.findOneQ(params)
    .then((impressionTracker) => {
            
      if (!impressionTracker) {
        impressionTracker = 
          new ImpressionTracker(Object.assign(params, { count: 0 }));
      }

      impressionTracker.count += 1;
      return impressionTracker.saveQ(); 
            
    })
    .then((impressionTracker) => {
        console.log("Saved impression tracker", impressionTracker);
    })
    .catch((err) => {
        console.log("Error in updateEventImpressions", err);
    });	
		
	}
		
	createEvent(event, user) {
	    
        let deferred = Q.defer();     
				
        delete event._id;				
        event.user = user.id;
        
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
        console.log("new event", event.info);

        this.checkSlug(event.slug)
        .then((available) => {

            if (available) {
                Event.create(event, (err, createdEvent) => {
                    if (err) { return deferred.reject(err); }
                    deferred.resolve(createdEvent); 
                });
            } else {
                deferred.reject(new Errors.UnprocessableEntity(null, { message: "invalid_or_duplicate_slug" }));
            }

        })
        .catch((err) => {
            deferred.reject(err);
        });

					
	    return deferred.promise;
		
	}
    
    updateEvent(event) {
        
        let deferred = Q.defer();

        let eventId = event._id;
        delete event._id; 
        
        console.log("payout info", event.payout);
        if (event.payout) {
            if (!IBAN.isValid(event.payout.iban) && event.payout.iban !== "IBAN123") {
                deferred.reject(new Errors.UnprocessableEntity(null, { message: "invalid_iban" }));
                return deferred.promise;
            }
        }

        Event.update({ _id: eventId }, event, (err, numAffected) => {
            
            if (!err && numAffected === 0) {
                err = new Errors.NotFound(null, { message: "event_not_found" }); 
            }

            if (err) { return deferred.reject(err); }
            
            deferred.resolve(event);

        });

        return deferred.promise;
    
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
                    if(salesStart < now || ticketResources[i].qtySold > 0) {
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
    
    checkSlug(slug) {

        let deferred = Q.defer();
        
        let badChars = slug.match(/(?!\-)\W/g);
        if (badChars && badChars.length > 0) {
            
            setTimeout(() => {
                deferred.resolve(false);
            });

            return deferred.promise;

        }

        Event.findQ({ slug: slug })
        .then((events) => {
            deferred.resolve(!(events && events.length > 0));
        })
        .catch((err) => {
            deferred.reject(err);
        });

        return deferred.promise;

    }

    getSlugs(title) {

        let deferred = Q.defer();

        let preSlug = title.toLowerCase().replace(/(?!\s)\W/g, "")
        let slugElems = preSlug.split(" ");
        
        let slugs = [];
        let slugBase = "";
        
        slugElems.forEach((slugElem) => {
            
            slugElem = slugElem.trim();
            
            if (slugElem !== "") {
                
                if (slugBase === "") {
                    slugBase += slugElem;
                } else {
                    slugBase += `-${slugElem}`;
                }
                
                slugs.push(slugBase);

            }

        });
        
        Event.findQ({ slug: { $in: slugs } })
        .then((events) => {
            
            if (events && events.length > 0) {
                
                let matchingSlugs = events.map(event => event.slug);
                let filteredSlugs = slugs.filter(slug => matchingSlugs.indexOf(slug) === -1)
                
                if (filteredSlugs.length === 0) {

                    let lastSlug = slugs[slugs.length - 1];
                    Event.where({ slug: new RegExp(`${lastSlug}(\-\d+)*`, "g") }).count()
                    .execQ()
                    .then((count) => {
                        console.log("slug count", count);
                        deferred.resolve([`${lastSlug}-${count}`]);
                    })
                    .catch((err) => {
                        console.log(err);
                        deferred.resolve([]);
                    });

                    return;

                }

                slugs = filteredSlugs;
                
            }

            deferred.resolve(slugs);    

        })
        .catch((err) => {
            deferred.reject(err);
        });

        return deferred.promise;

    }

    initRoutes() {
        let eventServiceRoutes = require("./eventServiceRoutes");
        eventServiceRoutes.init(this.app);
    }
	
}

module.exports = (app) => {
    return new EventService(app);
};
