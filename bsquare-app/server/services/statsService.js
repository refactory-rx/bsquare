import Q from "q";
import fs from "fs";
import url from "url";

let responseUtil = require("../utils/responseUtil");
let Ticket, TicketResource, Event, Order;

class StatsService {
    
    constructor(app) {
        ({ Ticket, TicketResource, Event, Order } = app.model);
        this.app = app;
    }

	getEventStats(eventId, statType) {
	    
	    if(statType === "tickets") {
	    	return this.getTicketStats(eventId);
	    } else if(statType === "revenue") {
	    	return this.getRevenueStats(eventId);
	    }
	          
	}
	
	getTicketStats(eventId) {
		
		let deferred = Q.defer();
		
		let response = {
	        success: 0
	    };
	    
		let countsByResource = {};
	    
	    TicketResource.findQ({ event: eventId })
        .then((ticketResources) => {
	        return ticketResources;
	    })
        .then((ticketResources) => {
	    	
	    	////console.log(ticketResources);

            ticketResources.forEach(ticketResource => {
	    		let countStat = {
	    			name: ticketResource.name,
	    			quantity: ticketResource.quantity,
	    			sold: 0,
	    			attended: 0
	    		}
	    		countsByResource[ticketResource._id.toHexString()] = countStat;
	    	});
	    	
            let ticketQueryPromises = ticketResources.map((ticketResource) => {
	           return Ticket.findQ({ ticketResourceId: ticketResource._id.toHexString() }) 
	        });
	        
	        return ticketQueryPromises;
	    
	    })
        .then((ticketQueryPromises) => {
	        return Q.all(ticketQueryPromises);
	    })
        .then((ticketQueryResults) => {
            ticketQueryResults.forEach(ticketQueryResult => {
                ticketQueryResult.forEach(ticket => {
	    			countsByResource[ticket.ticketResourceId].sold++;
	    			if(ticket.status === "used") {
	    				countsByResource[ticket.ticketResourceId].attended++;
	    			}
	    		});	
	    	});
	    	
	    	response.success = 1;
	    	response.status = "statsRetrieved";
	    	response.data = {
	    		countsByResource: countsByResource
	    	};
	    	
	    	deferred.resolve(response);
	    	
	    })
        .catch((err) => {
	        
	        console.log(err);
	        response.status = "statsError";
	        response.error = err.message;
	        response.data = err;
	        
	        deferred.resolve(response);
	        
	    });
	    
	    return deferred.promise;
			
	}
	
	getRevenueStats(eventId) {
		
		let deferred = Q.defer();
		
		let response = {
	        success: 0
	    };
	    
	    let availableTicketResources;
	    
	    TicketResource.findQ({ event: eventId })
        .then((ticketResources) => {
	        
	        availableTicketResources = ticketResources;
	        //console.log(ticketResources);
	        
	        return Order.find({ event: eventId }).sort({ timePlaced: 1 }).execQ();
	        
	    })
        .then((orders) => {
	    	
	    	if(orders.length === 0) {
	    		return [];
	    	}
	    	
	    	let lastTime;
	    	let lastTimeMark;
	    	
	    	let rowsByTimeMark = {};
	    	let reportRows = [];
	    	
	    	//console.log("orders.length = "+orders.length);
	    	
            orders.forEach(order => {

                //console.log(order.status, order.timePlaced);
	    		
	    		if(order.status === "fulfilled" && order.timePlaced) {
	    			
	    			let currentTimeMark = lastTimeMark;
	    			
	    			if(!lastTime) {
	    				lastTime = order.timePlaced;
	    				lastTimeMark = lastTime;
	    				currentTimeMark = lastTimeMark;
	    			}
	    			
	    			let timeDiff = order.timePlaced - lastTimeMark;
	    			timeDiff = timeDiff / (1000 * 60 * 15);
	    			
	    			//console.log("timeDiff="+timeDiff);
	    			if(timeDiff >= 1 || reportRows.length === 0) {
	    				
	    				currentTimeMark = order.timePlaced;
	    				lastTimeMark = currentTimeMark;
	    				
	    				let reportRow = {
	    					timeMark: currentTimeMark,
	    					revenuesByResource: {}
	    				};
	    				
                        availableTicketResources.map((ticketResource) => {
	    					reportRow.revenuesByResource[ticketResource._id.toHexString()] = {
	    						ticketName: ticketResource.name,
	    						value: 0
	    					};
	    				});
	    				
	    				reportRows.push(reportRow);
	    				
	    			}
	    			
                    order.items.forEach(item => {

	    				if(!reportRows[reportRows.length-1].revenuesByResource[item.ticketResource]) {
	    					return;
	    				}
	    				
                        reportRows[reportRows.length-1].revenuesByResource[item.ticketResource].value += 
                            item.price * item.quantity;

	    			});
	    			
	    			lastTime = order.timePlaced;
	    			
	    		}
	    		
	    	});
	        
	        let resourceIds;
	        
	        for(let i = 1; i < reportRows.length; i++) {
	        	resourceIds = Object.keys(reportRows[i].revenuesByResource);
                resourceIds.map((resourceId) => {
	        		reportRows[i].revenuesByResource[resourceId].value += reportRows[i-1].revenuesByResource[resourceId].value;	
	        	});
	        }
	        
	        return reportRows;
	    
	    })
        .then((reportRows) => {
	    	
	    	//console.log(reportRows);
	    	
	    	let tsv = "date\t";
	    	
	    	let resourceId;
	    	let revenueResources = [];
	    	
	        availableTicketResources.forEach(availableTicketResource => {	
	    		resourceId = availableTicketResource._id.toHexString();
	    		if(reportRows.length > 0 && reportRows[reportRows.length-1].revenuesByResource[resourceId].value > 0) {
	    			tsv += availableTicketResource.name+"\t";
	    			revenueResources.push(resourceId);
	    		}	
	    	});
	    	
	    	tsv = tsv.substring(0, tsv.length-1)+"\n";
	    	
	    	if(revenueResources.length > 0 && reportRows.length === 1) {
	    		
	    		tsv += (reportRows[0].timeMark-(60*60*1000))+"\t";
                revenueResources.forEach(revenueResource => {
	    			tsv += "0\t";
	    		});
	    		
	    		tsv = tsv.substring(0, tsv.length-1)+"\n";
	    	
	    	}
            
            reportRows.forEach((reportRow, i) => {
	            	
	    		tsv += reportRow.timeMark+"\t";

                availableTicketResources.forEach(availableTicketResource => {
	    			resourceId = availableTicketResource._id.toHexString();
	    			if(reportRows.length > 0 && reportRows[reportRows.length-1].revenuesByResource[resourceId].value > 0) {
	    				tsv += reportRow.revenuesByResource[resourceId].value+"\t";
	    			}
	    		});
	    		
	    		tsv = i < reportRows.length-1 ? tsv.substring(0, tsv.length-1)+"\n" : tsv;
	    		
	    	});
	    	
	    	//console.log(tsv);
			deferred.resolve(tsv);
			
	    })
        .catch((error) => {
	    	console.log(error)		
	    });
		
		
	    return deferred.promise;
			
	}

    initRoutes() {
        let statsServiceRoutes = require("./statsServiceRoutes");
        statsServiceRoutes.init(this.app);
    }
	
}

module.exports = (app) => {
    return new StatsService(app);
};
