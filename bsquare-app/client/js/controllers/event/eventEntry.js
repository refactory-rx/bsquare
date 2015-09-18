controllers.controller(
    "EventEntryCtrl", 
    ['$rootScope', '$scope', '$location', '$routeParams', '$http', '$log', '$timeout',
    ($rootScope, $scope, $location, $routeParams, $http, $log, $timeout) => {
	
	$scope.eventId = $routeParams.id;
	$scope.action = $routeParams.action;
	
	$scope.eventStatus = '';
    $scope.showEventError = false;
    $scope.eventErrorMessage = '';
    
	$scope.entryStatus = '';
    $scope.showError = false;
    $scope.errorMessage = '';
    $scope.ownEvent = false;
    
    $scope.ticketResources = [];
    $scope.publicTicketResources = [];
    
    $scope.$watch("event", (event) => {
    	
    	console.log("eventEntry->$watch(event): "+$scope.eventStatus);
    	
    	if (event) {
    		
    		if($scope.eventStatus === "loaded" || $scope.eventStatus === "saved") {
    
	    		$log.debug("event changed");
	        	$scope.eventStatus = "changed";
	        	
    		} else if($scope.eventStatus === "loading" || $scope.eventStatus === "preloaded") {
       			
        		$scope.eventStatus = "loaded";
    			
    		} 
    	    
            $rootScope.og.title = event.info.title;
            $rootScope.og.image = `${$rootScope.imgBaseUrl}${event.info.eventImage}`;    
            $rootScope.og.description = event.info.description;
            $rootScope.og.url = `${$rootScope.appUrl}/#/event/${event._id}`;    
    		
    	}
    	
    	
    }, true);
    
    
    $scope.$watch("eventId", (value) => {
        
        if(value) {
            
            $log.debug("eventId set: "+value);
            $scope.getEvent($scope.eventId);
            
        }
        
    }, true);
    
    
    $rootScope.changeEditViewHeight = (editViewHeight) => {
        $rootScope.editViewHeight = editViewHeight;
    };
    
    $scope.setEventStatus = (status) => {
		$scope.eventStatus = status;
		console.log("set event status: "+status);
	};
    
    $scope.getEvent = (id) => {
		
		$scope.showError = false;
		
		$log.debug("getting event "+id);
		
		var queryParams = $location.search();
		var getUrl = `/api/events/${id}`;
		var queryStr = "";
		
		if (queryParams.group) {
		    queryStr += `&group=${queryParams.group}`;
		}
		
		if (queryParams.ref) {
		    queryStr += `&ref=${queryParams.ref}`;
		}
		
		if (queryStr.length > 0) {
		    queryStr = "?"+queryStr.substring(1);
		    getUrl += queryStr;
		}
		
		$scope.eventStatus = "loading";
		
		$http.get(getUrl, { headers: requestHeaders } )
        .success((response) => {
            
            $log.debug(response);
            
            if (response.status === "ok") {
                
                $scope.event = response.event;
                
                if (response.ownEvent === "true") {
                    $scope.ownEvent = true;
                    if($scope.action === "edit") {
                        $rootScope.setRootView("edit");
                    }
                } else {
                    $scope.ownEvent = false;
                }
                
                //$(".event-content").css("height", ($(".event").height() - $(".columnHeader").height() - 15)+"px");
                            
            } else {
                $scope.eventStatus = "loadError";
                $scope.eventErrorMessage = response.message;
            }
            
        })
        .error((data) => {
            $log.debug("Error: ", data);
        });
			
	};
	
    $scope.getTicketResources = (callback) => {
        
        $log.debug("getting resources for:");
        $log.debug($scope.event);
        
        if(!$scope.event) {
            return;
        }
        
        $log.debug(`GET /api/ticketresources/${$scope.event._id}`);
        
        $http.get(`/api/ticketresources/${$scope.event._id}`, { headers: requestHeaders } )
        .success((response) => {
				
            $log.debug(response);
            
            if(response.status === "ticketResourcesFound") {
                
                var ticketResources = response.ticketResources;
                $scope.publicTicketResources = [];
                
                ticketResources.forEach(ticketResource => { 
                    ticketResource.orderQty = 0;
                    if(ticketResource.visibility !== "hidden") {
                        $scope.publicTicketResources.push(ticketResource);
                    }
                });
                
                $scope.ticketResources = ticketResources;
                
                if(callback) {
                    callback();
                }
                
            } else {
                $scope.eventStatus = "error";
                $scope.eventErrorMessage = response.message;
            }
            
        })
        .error((data) => {
            $log.debug("Error: ", data);
        });
        
        
    };
    
    
    $scope.initMap = () => {
	    
        if (!google) {
            return;
        }

		var mapCanvas = document.getElementById("map_canvas");
                        
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
