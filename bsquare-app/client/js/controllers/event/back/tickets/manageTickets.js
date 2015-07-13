controllers.controller(
    "event.back.tickets.ManageTicketsCtrl", 
    ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout', 'stringUtils', 'validationService',
        ($rootScope, $scope, $routeParams, $http, $log, $timeout, stringUtils, validationService) => {
	
	
    $scope.addTicketsOpen = false;
    
    $scope.newTicketResource = {
        bundledProducts: []
    };
    
    $scope.init = function() {
        $scope.getTicketResources();
    };
    
    
    $scope.editTicketResource = function(ticketResource) {
    	
    	$scope.editingTicketResource = true;
    	
    	if(ticketResource) {
    		
    		$scope.newTicketResource = ticketResource;
	    	
    		if(ticketResource.salesStart) {
    			$scope.salesStartTime = new Date(ticketResource.salesStart);
    		} else {
    			$scope.salesStartTime = new Date();
    		}
    		
    		if(ticketResource.salesEnd) {
	           	$scope.salesEndTime = new Date(ticketResource.salesEnd);
    		} else {
    			$scope.salesEndTime = new Date($scope.event.info.timeStart);
    		}
    		
    	} else {
    		
    		var startTime = new Date();
    		var endTime = new Date($scope.event.info.timeStart);
    		
    		$scope.salesStartTime = startTime;
    		$scope.salesEndTime = endTime;
    		
    		$scope.newTicketResource = {
        		bundledProducts: [],
        		isPublic: true,
        		authorizedInvalidation: false,
        		salesStart: startTime.getTime(),
        		salesEnd: endTime.getTime(),
        		status: 'undeletable'
    		};
    		
    	}
    	
    };
    
    
    $scope.cancelTicketResourceEdit = function() {
    	
    	if($scope.validationErrors) {
    		delete $scope.validationErrors;
    	}
    				
    	$scope.editingTicketResource = false;
    
    };
    
    $scope.saveTicketResource = function() {
    	
    	var ticketResource = $scope.newTicketResource;
    	
    	if($scope.validationErrors) {
    		delete $scope.validationErrors;
    	}
    	
    	var validationErrors = validationService.validateTicketResourceFields(ticketResource, $scope.event);
    	if(validationErrors.keys.length > 0) {
    		$scope.validationErrors = validationErrors;
    		return;
    	}
    	
    	ticketResource.event = $scope.event;
    	
    	var saveTicketResourceRequest = {
        	ticketResource: ticketResource
        };
        
        $log.debug(saveTicketResourceRequest);
        	
        $http.post('/api/ticketresources', saveTicketResourceRequest, { headers: requestHeaders } )
    		.success(function(response) {
    			
    			$log.debug(response);
    			
    			$rootScope.screenResponse(response, function() {
    				
    				
    				if(response.status == 'ticketResourceSaved') {
    					
    					$scope.getTicketResources();
    					
    				} else if(response.status == 'ticketResourceCreated') {
    					
    					$scope.getTicketResources();
    					
    					//var createdTicketResource = response.ticketResource;
    					//$scope.ticketResources.push(createdTicketResource);
    					
    					$scope.newTicketResource = {
    					    bundledProducts: []
    					};
    					
    				} else {
    					$scope.showError = true;
    					$scope.errorMessage = response.message;
    				}
    				
    				$scope.editingTicketResource = false;
    				
    			});
    		
    		})
    		.error(function(data) {
    			$log.debug('Error: ' + data);
    		});
    	
    };
    
    $scope.deleteTicketResource = function(ticketResource) {
    	
    	$http.delete('/api/ticketresources/'+ticketResource._id, { headers: requestHeaders } )
	   	.success(function(response) {
				
			$log.debug(response);
				
			$rootScope.screenResponse(response, function() {
					
				if(response.status == 'ticketResourceDeleted') {
				    
				    $scope.getTicketResources();
				    $scope.addTicketsOpen = false;
				    
				    if($scope.validationErrors) {
    					delete $scope.validationErrors;
    				}
					
				} else {
					$scope.showError = true;
					$scope.errorMessage = response.message;
				}
				
			});
		
		})
		.error(function(data) {
			$log.debug('Error: ' + data);
		});
			
    };
    
	
	$scope.bundleProduct = function(ticketResource) {
	    
	    
	    var bundleProductRequest = {
	        eventId: $scope.event._id,
	        productUrl: ticketResource.newProductUrl    
	    };
	    
	    $log.debug('Bundle product:');
	    $log.debug(bundleProductRequest);
	    
	    $http.post('/api/bundleproduct', bundleProductRequest, { headers: requestHeaders } )
	        .success(function(response) {
				
				$log.debug(response);
				
				$rootScope.screenResponse(response, function() {
					
					if(response.status == 'productBundled') {
					    
					    var bundledProduct = response.product;
					    ticketResource.bundledProducts.push(bundledProduct);
					    
					} else {
						$scope.showError = true;
						$scope.errorMessage = response.message;
					}
					
				});
			
			})
			.error(function(data) {
				$log.debug('Error: ' + data);
			});
	
	    
	};
	
	
	$scope.removeBundledProduct = function(product, ticketResource) {
	    
	    var updatedProducts = [];
	    for(var i=0; i < ticketResource.bundledProducts.length; i++) {
	        if(product.productUrl != ticketResource.bundledProducts[i].productUrl) {
	            updatedProducts.push(ticketResource.bundledProducts[i]);
	        }
	    }
	    
	    ticketResource.bundledProducts = updatedProducts;
	    
	};
    
    
    $scope.$watch('salesStartTime', function(startTime) {
        if(startTime) {
    		$scope.newTicketResource.salesStart = startTime.getTime();
    	}
    }, true);
    
    $scope.$watch('salesEndTime', function(endTime) {
        if(endTime) {
    		$scope.newTicketResource.salesEnd = endTime.getTime();
    	}
    }, true);
    
	
	$scope.init();
	
    
    
}]);
