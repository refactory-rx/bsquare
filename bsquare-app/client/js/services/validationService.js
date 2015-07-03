mainApp.factory('validationService', [function() {
   
    return  {
     
        validateEventFields: function(info) {
    	
        	var validationErrors = {};
        	var validationErrorKeys = [];
        	
        	if(!info.title || info.title.length === 0) {
        		validationErrors.title = 'Event name is missing.';
        		validationErrorKeys.push('title');
        	}
        	
        	if(!info.place) {
        		validationErrors.place = 'Event place is missing.';
        		validationErrorKeys.push('place');
        	}
        	
        	if(!info.timeStart) {
        		validationErrors.timeStart = 'Event start time is missing.';
        		validationErrorKeys.push('timeStart');
        	}
        	
        	if(!info.timeEnd) {
        		validationErrors.timeEnd = 'Event end time is missing.';
        		validationErrorKeys.push('timeEnd');
        	} else if(info.timeStart && info.timeEnd && info.timeStart > info.timeEnd) {
        		validationErrors.timeEnd = 'Event end time is before the start time.';
        		validationErrorKeys.push('timeEnd');
        	}
        	
        	validationErrors.keys = validationErrorKeys;
        	return validationErrors;
    	
        },
        
        validateTicketResourceFields: function(ticketResource, event) {
    	
        	var validationErrors = {};
        	var validationErrorKeys = [];
        	
        	if(!ticketResource.name || ticketResource.name.length === 0) {
        		validationErrors.name = 'Ticket name is missing.';
        		validationErrorKeys.push('name');
        	}
        	
        	if(!ticketResource.price && ticketResource.price !== 0) {
        		validationErrors.price = 'Price is missing.';
        		validationErrorKeys.push('price');
        	} else if(ticketResource.price < 0) {
        		validationErrors.price = 'Price is negative.';
        		validationErrorKeys.push('price');
        	} else if(isNaN(ticketResource.price)) {
        		validationErrors.price = 'Price is not a number.';
        		validationErrorKeys.push('price');
        	}
        	
        	if(!ticketResource.quantity || ticketResource.quantity === 0) {
        		validationErrors.quantity = 'Quantity is missing or 0.';
        		validationErrorKeys.push('quantity');
        	} else if(ticketResource.quantity < 0) {
        		validationErrors.quantity = 'Quantity is negative.';
        		validationErrorKeys.push('quantity');
        	} else if(isNaN(ticketResource.quantity)) {
        		validationErrors.quantity = 'Quantity is not a number.';
        		validationErrorKeys.push('quantity');
        	}
        	
        	if(!ticketResource.allowedPerOrder || ticketResource.allowedPerOrder === 0) {
        		validationErrors.allowedPerOrder = 'Max/order is missing or 0.';
        		validationErrorKeys.push('allowedPerOrder');
        	} else if(ticketResource.allowedPerOrder < 0) {
        		validationErrors.allowedPerOrder = 'Max/order is negative.';
        		validationErrorKeys.push('allowedPerOrder');
        	} else if(isNaN(ticketResource.allowedPerOrder)) {
        		validationErrors.allowedPerOrder = 'Max/order is not a number.';
        		validationErrorKeys.push('allowedPerOrder');
        	}
        	
        	if(!ticketResource.salesStart) {
        		validationErrors.salesStart = 'Sales start time is missing.';
        		validationErrorKeys.push('salesStart');
        	}
        	
        	if(!ticketResource.salesEnd) {
        		validationErrors.salesEnd = 'Sales end time is missing.';
        		validationErrorKeys.push('salesEnd');
        	} else if(ticketResource.salesStart && ticketResource.salesEnd && ticketResource.salesStart > ticketResource.salesEnd) {
        		validationErrors.salesEnd = 'Sales end time is before the start time.';
        		validationErrorKeys.push('salesEnd');
        	}
        	
        	if(ticketResource.price > 0 && (!event.payout || !event.payout.iban)) {
        		validationErrors.payout = 'Event payout info missing for chargeable tickets.';
        		validationErrorKeys.push('payout');
        	}
        	
        	validationErrors.keys = validationErrorKeys;
        	return validationErrors;
    	
        }
        
    };
   
 }]);