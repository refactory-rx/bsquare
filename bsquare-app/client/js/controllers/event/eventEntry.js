controllers.controller('EventEntryCtrl', 
		['$rootScope', '$scope', '$location', '$routeParams', '$http', '$log', '$timeout',
		 function($rootScope, $scope, $location, $routeParams, $http, $log, $timeout) {
	
	$scope.eventId = $routeParams.id;
	$scope.action = $routeParams.action;
	
	$scope.event = undefined;
	$scope.eventStatus = '';
    $scope.showEventError = false;
    $scope.eventErrorMessage = '';
    
	$scope.entryStatus = '';
    $scope.showError = false;
    $scope.errorMessage = '';
    $scope.ownEvent = false;
    
    $scope.ticketResources = [];
    $scope.publicTicketResources = [];
    
    $scope.$watch('event', function(value) {
    	
    	console.log('eventEntry->$watch(event): '+$scope.eventStatus);
    	
    	if(value !== undefined) {
    		
    		if($scope.eventStatus === 'loaded' || $scope.eventStatus === 'saved') {
    
	    		$log.debug('event changed');
	        	$scope.eventStatus = 'changed';
	        	
    		} else if($scope.eventStatus == 'loading' || $scope.eventStatus == 'preloaded') {
       			
        		$scope.eventStatus = 'loaded';
    			
    		} 
    		
    		
    	}
    	
    	
    }, true);
    
    
    $scope.$watch('eventId', function(value) {
        
        if(value !== undefined) {
            
            $log.debug('eventId set: '+value);
            $scope.getEvent($scope.eventId);
            
        }
        
    }, true);
    
    
    $rootScope.changeEditViewHeight = function(editViewHeight) {
        $rootScope.editViewHeight = editViewHeight;
    };
    
    $scope.setEventStatus = function(status) {
		$scope.eventStatus = status;
		console.log('set event status: '+status);
	};
    
    $scope.getEvent = function(id) {
		
		$scope.showError = false;
		
		$log.debug('getting event '+id);
		
		var queryParams = $location.search();
		var getUrl = '/api/events/'+id;
		var queryStr = '';
		
		if(queryParams.group !== undefined) {
		    queryStr += '&group='+queryParams.group;
		}
		
		if(queryParams.ref !== undefined) {
		    queryStr += '&ref='+queryParams.ref;
		}
		
		if(queryStr.length > 0) {
		    queryStr = '?'+queryStr.substring(1);
		    getUrl += queryStr;
		}
		
		$scope.eventStatus = 'loading';
		
		$http.get(getUrl, { headers: requestHeaders } )
			.success(function(response) {
				
				$log.debug(response);
				
				if(response.status == 'eventFound') {
					
    				$scope.event = response.event;
    				
    				if(response.ownEvent == 'true') {
    			        
                        $scope.ownEvent = true;
    					if($scope.action == 'edit') {
                            $rootScope.setRootView('edit');
    					}
                        
    				} else {
    					
    					$scope.ownEvent = false;
    					
    				}
		            
                    $('.event-content').css('height', ($('.event').height() - $('.columnHeader').height() - 15)+'px');
                    			
				} else {
					$scope.eventStatus = 'loadError';
					$scope.eventErrorMessage = response.message;
				}
				
			})
			.error(function(data) {
				$log.debug('Error: ' + data);
			});
			
	};
	
	 $scope.getTicketResources = function(callback) {
        
        $log.debug('getting resources for:');
        $log.debug($scope.event);
        
        if($scope.event === undefined) {
            return;
        }
        
        $log.debug('GET /api/ticketresources/'+$scope.event._id);
        
        $http.get('/api/ticketresources/'+$scope.event._id, { headers: requestHeaders } )
			.success(function(response) {
				
				$log.debug(response);
				
				if(response.status == 'ticketResourcesFound') {
				    
				    var ticketResources = response.ticketResources;
				    $scope.publicTicketResources = [];
				    
				    for(var i=0; i<ticketResources.length; i++) {
				        ticketResources[i].orderQty = 0;
				        if(ticketResources[i].visibility != 'hidden') {
				        	$scope.publicTicketResources.push(ticketResources[i]);
				        }
				    }
				    
					$scope.ticketResources = ticketResources;
					
					if(callback) {
						callback();
					}
					
				} else {
					$scope.eventStatus = 'error';
					$scope.eventErrorMessage = response.message;
				}
				
			})
			.error(function(data) {
				$log.debug('Error: ' + data);
			});
        
        
    };
    
    
	$scope.initMap = function() {
		
		var mapCanvas = document.getElementById('map_canvas');
                        
        var mapOptions = {
        	center: new google.maps.LatLng($scope.event.info.place.coords.lat, $scope.event.info.place.coords.lng),
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            draggable: false
        };
        
        console.log(mapCanvas);
        
        var map = new google.maps.Map(mapCanvas, mapOptions);			
		var marker = new google.maps.Marker({
  			position: mapOptions.center,
  			map: map
		});
		
	};

	
}]);
