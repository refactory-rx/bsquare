controllers.controller(
    "MyEventCtrl", 
    ["$rootScope", "$scope", "$routeParams", "$http", "$log", "$timeout",
    ($rootScope, $scope, $routeParams, $http, $log, $timeout) => {
	
	$scope.eventStatus = '';
	
	$scope.eventView = 'settings';
    $scope.showError = false;
    $scope.errorMessage = '';
    
    $scope.firstLoad = '';
    $scope.eventChanged = false;
    
    $scope.savedEvent = undefined;
    $scope.event = {};
    
    $scope.addTicketsOpen = false;
    
    $scope.ticketResources = [];
    $scope.newTicketResource = {};
    
    $scope.viewHeight = 420;
    
    $scope.eventStatus = 'N/A';
    
    $scope.stats = {
        sold: 'N/A',
        reserved: 'N/A',
        remains: 'N/A'
    };
    
    
    $scope.init = (myEvent, firstLoad) => {
    	
    	$log.debug('init event in list: ');
    	$log.debug(myEvent);
    	
    	if(myEvent) {
    		
            $timeout(() => {
    			
    			$scope.event = myEvent;
    	        
    	        if($scope.event._id && $scope.event._id !== 'new') {
    	            
    	            var now = (new Date()).getTime();
    	            
    	            if($scope.event.status) {
    	                $scope.eventStatus = $scope.event.status.toUpperCase();
    	            } else {
    	                
    	                if($scope.event.info.timeStart > now) {
    	                    $scope.eventStatus = "COMING";
    	                } else if($scope.event.info.timeEnd < now) {
    	                    $scope.eventStatus = "ENDED";
    	                } else if($scope.event.info.timeStart < now < $scope.event.info.timeEnd) {
    	                    $scope.eventStatus = "HAPPENING";
    	                }
    	                
    	            }
    	            
    	            $http.get("/api/ticketresources/"+$scope.event._id, { headers: requestHeaders } )
                    .success((response) => {
        				
        				$log.debug(response);
        				
        				if(response.status === "ticketResourcesFound") {
        			    
        			        var ticketResources = response.ticketResources;
        				    
        				    var soldTotal = 0, reservedTotal = 0, remainsTotal = 0;
        				    
        				    for(var i=0; i < ticketResources.length; i++) {
        				        
        				        if(ticketResources[i].qtySold) {
        				            soldTotal += ticketResources[i].qtySold;
        				        }
        				        
        				        if(ticketResources[i].qtyReserved) {
        				            reservedTotal += ticketResources[i].qtyReserved;
        				        }
        				        
        				        if(ticketResources[i].qtyAvailable) {
        				            remainsTotal += ticketResources[i].qtyAvailable;
        				        }
        				        
        				    }
        				    
        				    $scope.stats.sold = soldTotal;
        				    $scope.stats.reserved = reservedTotal;
        				    $scope.stats.remains = remainsTotal;
        			       
            	        }
            	        
        			});
        			
    	        }
    	        
			        
    		}, true);
    		
    	}
    	
    };
    
    
}]);
