mainApp.factory("validationService", ["$translate", function($translate) {
   
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
        		validationErrors.name = $translate.instant("event.back.tickets.ticketNameMissing");
        		validationErrorKeys.push("name");
        	}
        	
        	if(!ticketResource.price && ticketResource.price != 0) {
        		validationErrors.price = $translate.instant("event.back.tickets.priceMissing");
        		validationErrorKeys.push("price");
        	} else if(ticketResource.price < 0) {
        		validationErrors.price = $translate.instant("event.back.tickets.priceNegative");
        		validationErrorKeys.push("price");
        	} else if(isNaN(ticketResource.price)) {
        		validationErrors.price = $translate.instant("event.back.tickets.priceIsNaN");
        		validationErrorKeys.push("price");
        	}
        	
        	if(!ticketResource.quantity || ticketResource.quantity == 0) {
        		validationErrors.quantity = $translate.instant("event.back.tickets.qtyMissingOr0");
        		validationErrorKeys.push("quantity");
        	} else if(ticketResource.quantity < 0) {
        		validationErrors.quantity = $translate.instant("event.back.tickets.qtyNegative");
        		validationErrorKeys.push("quantity");
        	} else if(isNaN(ticketResource.quantity) || ticketResource.quantity % 1 !== 0) {
        		validationErrors.quantity = $translate.instant("event.back.tickets.qtyIsNaN");
        		validationErrorKeys.push("quantity");
        	}
        	
        	if(!ticketResource.allowedPerOrder || ticketResource.allowedPerOrder == 0) {
        		validationErrors.allowedPerOrder = $translate.instant("event.back.tickets.maxOrderMissingOr0");
        		validationErrorKeys.push("allowedPerOrder");
        	} else if(ticketResource.allowedPerOrder < 0) {
        		validationErrors.allowedPerOrder = $translate.instant("event.back.tickets.maxOrderNegative");
        		validationErrorKeys.push("allowedPerOrder");
        	} else if(isNaN(ticketResource.allowedPerOrder) || ticketResource.allowedPerOrder % 1 !== 0) {
        		validationErrors.allowedPerOrder = $translate.instant("event.back.tickets.maxOrderIsNaN");
        		validationErrorKeys.push("allowedPerOrder");
        	}
        	
        	if(!ticketResource.salesStart) {
        		validationErrors.salesStart = $translate.instant("event.back.tickets.salesStartMissing");
        		validationErrorKeys.push("salesStart");
        	}
        	
        	if(!ticketResource.salesEnd) {
        		validationErrors.salesEnd = $translate.instant("event.back.tickets.salesEndMissing");
        		validationErrorKeys.push("salesEnd");
        	} else if(ticketResource.salesStart && ticketResource.salesEnd && ticketResource.salesStart > ticketResource.salesEnd) {
        		validationErrors.salesEnd = $translate.instant("event.back.tickets.salesEndBeforeStart");
        		validationErrorKeys.push("salesEnd");
        	}
        	
        	if(ticketResource.price > 0 && (!event.payout || !event.payout.iban)) {
        		validationErrors.payout = $translate.instant("event.back.tickets.payoutInfoMissing");
        		validationErrorKeys.push("payout");
        	}
        	
        	validationErrors.keys = validationErrorKeys;
        	return validationErrors;
    	
        }
        
    };
   
 }]);
