var Q = require('q');
var fs = require('fs');
var url = require('url');

var responseUtil = require('../utils/responseUtil');

module.exports = function(app) {
    
    let { Ticket, TicketResource, Event, Order } = app.model;

    var module = {};

    module.exports = {

	getEventStats: function(eventId, statType) {
	    
	    if(statType === 'tickets') {
	    	return module.exports.getTicketStats(eventId);
	    } else if(statType === 'revenue') {
	    	return module.exports.getRevenueStats(eventId);
	    }
	          
	},
	
	
	getTicketStats: function(eventId) {
		
		var deferred = Q.defer();
		
		var response = {
	        success: 0
	    };
	    
		var countsByResource = {};
	    
	    TicketResource.findQ({ event: eventId })
	    .then(function(ticketResources) {
	        return ticketResources;
	    })
	    .then(function(ticketResources) {
	    	
	    	////console.log(ticketResources);
	    	
	    	for(var i=0; i<ticketResources.length; i++) {
	    		var countStat = {
	    			name: ticketResources[i].name,
	    			quantity: ticketResources[i].quantity,
	    			sold: 0,
	    			attended: 0
	    		}
	    		countsByResource[ticketResources[i]._id.toHexString()] = countStat;
	    	}
	    	
	        var ticketQueryPromises = ticketResources.map(function(ticketResource) {
	           return Ticket.findQ({ ticketResourceId: ticketResource._id.toHexString() }) 
	        });
	        
	        return ticketQueryPromises;
	    
	    })
	    .then(function(ticketQueryPromises) {
	        return Q.all(ticketQueryPromises);
	    })
	    .then(function(tickets) {
	    	
	    	////console.log(countsByResource);
	    	////console.log(tickets);
	    	
	    	for(var i=0; i<tickets.length; i++) {
	    		//console.log('ticket', tickets[i]);
	    		for(var j=0; j<tickets[i].length; j++) {
	    			//console.log('get by '+tickets[i][j].ticketResourceId);
	    			countsByResource[tickets[i][j].ticketResourceId].sold++;
	    			if(tickets[i][j].status === 'used') {
	    				countsByResource[tickets[i][j].ticketResourceId].attended++;
	    			}
	    		}
	    		
	    	}
	    	
	    	response.success = 1;
	    	response.status = 'statsRetrieved';
	    	response.data = {
	    		countsByResource: countsByResource
	    	};
	    	
	    	////console.log(response);
	    	
	    	deferred.resolve(response);
	    	
	    })
	    .catch(function(err) {
	        
	        //console.log(err);
	        response.status = 'statsError';
	        response.error = err.message;
	        response.data = err;
	        
	        deferred.resolve(response);
	        
	    });
	    
	    return deferred.promise;
			
	},
	
	
	getRevenueStats: function(eventId) {
		
		var deferred = Q.defer();
		
		var response = {
	        success: 0
	    };
	    
	    var availableTicketResources;
	    
	    TicketResource.findQ({ event: eventId })
	    .then(function(ticketResources) {
	        
	        availableTicketResources = ticketResources;
	        //console.log(ticketResources);
	        
	        return Order.find({ event: eventId }).sort({ timePlaced: 1 }).execQ();
	        
	    })
	    .then(function(orders) {
	    	
	    	if(orders.length === 0) {
	    		return [];
	    	}
	    	
	    	var lastTime;
	    	var lastTimeMark;
	    	
	    	var rowsByTimeMark = {};
	    	var reportRows = [];
	    	
	    	//console.log('orders.length = '+orders.length);
	    	
	    	for(var i=0; i<orders.length; i++) {
	    		
	    		var order = orders[i];
	    		//console.log(order.status, order.timePlaced);
	    		
	    		if(order.status === 'fulfilled' && order.timePlaced) {
	    			
	    			var currentTimeMark = lastTimeMark;
	    			
	    			if(!lastTime) {
	    				lastTime = order.timePlaced;
	    				lastTimeMark = lastTime;
	    				currentTimeMark = lastTimeMark;
	    			}
	    			
	    			var timeDiff = order.timePlaced - lastTimeMark;
	    			timeDiff = timeDiff / (1000 * 60 * 15);
	    			
	    			//console.log('timeDiff='+timeDiff);
	    			if(timeDiff >= 1 || reportRows.length === 0) {
	    				
	    				currentTimeMark = order.timePlaced;
	    				lastTimeMark = currentTimeMark;
	    				
	    				var reportRow = {
	    					timeMark: currentTimeMark,
	    					revenuesByResource: {}
	    				};
	    				
	    				availableTicketResources.map(function(ticketResource) {
	    					reportRow.revenuesByResource[ticketResource._id.toHexString()] = {
	    						ticketName: ticketResource.name,
	    						value: 0
	    					};
	    				});
	    				
	    				reportRows.push(reportRow);
	    				
	    			}
	    			
	    			for(var j=0; j<order.items.length; j++) {
	    				
	    				var item = order.items[j];
	    				
	    				if(!reportRows[reportRows.length-1].revenuesByResource[item.ticketResource]) {
	    					continue;
	    				}
	    				
	    				reportRows[reportRows.length-1].revenuesByResource[item.ticketResource].value += item.price * item.quantity;
	    				
	    			}
	    			
	    			lastTime = order.timePlaced;
	    			
	    		}
	    		
	    	}
	        
	        var resourceIds;
	        
	        for(var i=1; i<reportRows.length; i++) {
	        	resourceIds = Object.getOwnPropertyNames(reportRows[i].revenuesByResource);
	        	resourceIds.map(function(resourceId) {
	        		reportRows[i].revenuesByResource[resourceId].value += reportRows[i-1].revenuesByResource[resourceId].value;	
	        	});
	        }
	        
	        return reportRows;
	    
	    })
	    .then(function(reportRows) {
	    	
	    	//console.log(reportRows);
	    	
	    	var tsv = 'date\t';
	    	
	    	var resourceId;
	    	var revenueResources = [];
	    	
	    	for(var i=0; i<availableTicketResources.length; i++) {
	    		
	    		resourceId = availableTicketResources[i]._id.toHexString();
	    		if(reportRows.length > 0 && reportRows[reportRows.length-1].revenuesByResource[resourceId].value > 0) {
	    			tsv += availableTicketResources[i].name+'\t';
	    			revenueResources.push(resourceId);
	    		}
	    		
	    	}
	    	
	    	tsv = tsv.substring(0, tsv.length-1)+'\n';
	    	
	    	if(revenueResources.length > 0 && reportRows.length === 1) {
	    		
	    		tsv += (reportRows[0].timeMark-(60*60*1000))+'\t';
	    		for(var i=0; i<revenueResources.length; i++) {
	    			tsv += '0\t';
	    		}
	    		
	    		tsv = tsv.substring(0, tsv.length-1)+'\n';
	    	
	    	}
	    	
	    	for(var i=0; i<reportRows.length; i++) {
	    		
	    		tsv += reportRows[i].timeMark+'\t';
	    		
	    		for(var j=0; j<availableTicketResources.length; j++) {
	    			resourceId = availableTicketResources[j]._id.toHexString();
	    			if(reportRows.length > 0 && reportRows[reportRows.length-1].revenuesByResource[resourceId].value > 0) {
	    				tsv += reportRows[i].revenuesByResource[resourceId].value+'\t';
	    			}
	    		}
	    		
	    		tsv = i < reportRows.length-1 ? tsv.substring(0, tsv.length-1)+'\n' : tsv;
	    		
	    	}
	    	
	    	//console.log(tsv);
			deferred.resolve(tsv);
			
	    })
	    .catch(function(error) {
	    	console.log(error)		
	    });
		
		
	    return deferred.promise;
			
	},
	
	
	initRoutes: function() {
		
		app.get('/api/stats/:eventId/:statType', function(req, res) {
		    
		    //console.log('screen request to get stats');
		    
		    app.authService.screenRequest(req, true, function(authResult) {
	            
	            if(authResult.status === 'authorized') {
	            	
	            	var statType = req.params.statType;
	                ////console.log('get stats for '+req.params.eventId);        
	                module.exports.getEventStats(req.params.eventId, statType)
	                .then(function(response) {
	                   	////console.log('returning stats', response);
	                	
	                	if(statType === 'revenue') {
	                		res.end(response);	
	                	} else {
	                		res.json(response);
	                	}
	                	
	                });
	                
	            } else {
	                res.json(authResult);
	            }
	            
	        });
		});
		
    }

    };

    return module.exports;
	
};
