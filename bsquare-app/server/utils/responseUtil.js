module.exports = {
    
    createUpdateResponse: function(entityName, error, data, callback) {
        return module.exports.createDefaultStandardResponse(entityName, 'update', error, data, callback);
    },
    
    createFindResponse: function(entityName, error, data, callback) {
        return module.exports.createDefaultStandardResponse(entityName, 'find', error, data, callback);
    },
    
    createDefaultStandardResponse: function(entityName, operation, error, data, callback) {
		
		var onError = {};
		var onNoData = {};
	    var onSuccess = {};
	    
	    if(operation == 'find') {
	        
	        onError.status = 'errorFinding'+entityName+'s';
	        onError.message = 'Error finding '+entityName.toLowerCase()+'s';
	        onNoData.status = entityName.toLowerCase()+'sNotFound';
	        onNoData.message = entityName+'s not found';
	        onSuccess.status = entityName.toLowerCase()+'sFound';
	        onSuccess.message = entityName+'s found';
	        
	    } else if(operation == 'update') {
	        
	        onNoData.status = 'noDataReturned';
	        onNoData.message = 'No data returned';
	        onSuccess.status = entityName.toLowerCase()+'sUpdated';
	        onSuccess.message = entityName+'s updated';
	        onError.status = 'errorUpdating'+entityName+'s';
	        onError.message = 'Error updating '+entityName.toLowerCase()+'s';
	        
	    }
		
		return module.exports.createStandardResponse(onError, onNoData, onSuccess, { error: error, data: data }, callback);
		
		
	},
	
	createStandardResponse: function(onError, onNoData, onSuccess, result, callback) {
		
		var response = null;
		
		//console.log('create standard response');
		
		if(result.error) {
			response = module.exports.createErrorResponse(onError.status, onError.message, result.error);
		} else {
			if(result.data) {
				response = module.exports.createSuccessResponse(onSuccess.status, onSuccess.message, result.data);
			} else {
				response = module.exports.createErrorResponse(onNoData.status, onNoData.message, result.data);
			}
		}
		
		////console.log(response);
		
		if(callback) {
			callback(response);
		}
			
	},
	
	
	createSuccessResponse: function(status, message, data) {
		
		var response = {
			success: 1,
			status: status,
			message: message,
			data: data
		};
		
		return response;
		
	},
	
	
	createErrorResponse: function(status, message, error) {
		
		var response = {
			success: 0,
			status: status,
			message: message,
			data: error
		};
		
		return response;
		
	}
	
};