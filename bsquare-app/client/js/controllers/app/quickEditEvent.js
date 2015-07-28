controllers.controller(
    "QuickEditEventCtrl", 
    ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout', 'stringUtils', 'validationService',
    ($rootScope, $scope, $routeParams, $http, $log, $timeout, stringUtils, validationService) => {
	
	$scope.eventStatus = "init";
	
	$scope.eventView = "settings";
    $scope.showError = false;
    $scope.errorMessage = "";
    
    $scope.firstLoad = "";
    $scope.eventChanged = false;
    
    $scope.eventExists = false;
    
    $scope.event = {};
    
    $scope.viewHeight = 420; 
    
    $scope.loadInit = (myEvent, firstLoad) => {
    	
    	console.log("loadInit", firstLoad, myEvent);
    	
    	if(myEvent) {
    		
    		$timeout(function() {
    			
    			$scope.event = myEvent;
    			
    			if(!$scope.event.info) {
    				$scope.event.info = {};
    			}
    			
    			if(firstLoad) {
    	    		$scope.firstLoad = firstLoad;
    	    	} else {
    	    		$scope.firstLoad = "loading";
    	    	}
    			
    			if(myEvent.info.title) {
    			    $scope.eventExists = true;
    			}
    			
    			if($scope.event.info.timeStart) {
	                $scope.eventStartTime = new Date($scope.event.info.timeStart);
	    		}
	    		
	            if($scope.event.info.timeEnd) {
	                $scope.eventEndTime = new Date($scope.event.info.timeEnd);
	    		}
	    		
	    		if($scope.event.info.place) {
	                var input = document.getElementById('place-input');
	                console.log($scope.event);
	                input.value = $scope.event.info.place.address;
	            }
	    		
    			$log.debug('loadInit called for '+myEvent._id);
    			
    		}, true);
    		
    	}
    	
    	
    };
    
    
    $scope.$watch('event', function(value) {
    	
    	console.log($scope.eventStatus, $scope.firstLoad);
    	
    	if(value !== undefined) {
    		
    		if($scope.firstLoad == 'loaded') {
    
	    		$log.debug('event changed');
	        	$scope.eventChanged = true;
	        	$scope.eventStatus = 'changed';
	        	
    		}
    		
    		else if($scope.firstLoad == 'loading' || $scope.firstLoad == 'preloaded') {
        		$scope.firstLoad = 'loaded';
        	}
    		
    		else if($scope.firstLoad === '') {
        		$scope.firstLoad = 'loading';
        	}
        	
    		
    	}
    	
    	
    }, true);
    
    $scope.$watch('app.route', function(value) {
    	
    	if(value !== undefined) {
    		$scope.updateView(value.params);
    	}
    	
    }, true);
    
    $scope.$on('$routeUpdate', function(current, next) {
    	$scope.updateView(next.params);
    });
    
    $scope.updateView = function(params) {
    	
    	if(params.view == 'myEvents' && params.action !== undefined) {
    		if(params.action == 'new') {
    			$scope.eventStatus = 'new';
    			$scope.event = {};
    		} else {
    			$scope.eventId = params.action;
    		}
    	}
    	
    };
    
    
    $scope.setView = function(view) {
    	
    	$scope.eventView = view;
    	
    	if(view == 'settings') {
    		$rootScope.changeEditViewHeight(420);
    	}
    	
    	$log.debug('eventView -> '+$scope.eventView);
    	
    };
    
    $scope.clearError = function(field) {
    	
    	if($scope.validationErrors) {
    		
    		delete $scope.validationErrors[field];
    		
    		var keyIndex = -1;
    		for(var i=0; i<$scope.validationErrors.keys.length; i++) {
    			if($scope.validationErrors.keys[i] == field) {
    				keyIndex = i;
    				break;
    			}
    		}
    		
    		if(keyIndex != -1) {
    			$scope.validationErrors.keys.splice(keyIndex, 1);
    			if($scope.validationErrors.keys.length === 0) {
    				delete $scope.validationErrors;
    			}
    		}
    		
    	}
    	
    };
    
    $scope.submit = function() {
        
        var event = $scope.event;
        
        /*
        var timeStartStr = $('#timeStart').val();
    	var timeEndStr = $('#timeEnd').val();
    	
    	if(timeStartStr && timeStartStr.length === 19) {
    		var timeStart = stringUtils.parseDate(timeStartStr);
    		event.info.timeStart = timeStart.getTime();
    	}
    	
    	if(timeEndStr && timeEndStr.length === 19) {
    		var timeEnd = stringUtils.parseDate(timeEndStr);
    	    event.info.timeEnd = timeEnd.getTime();
    	}
    	*/
    	
        $scope.saveEvent(event);
        
    };
    
    
    $scope.saveEvent = (event, callback) => {
    	
    	console.log("quick-save event");
    	
    	$scope.eventStatus = "";
    	$scope.showError = false;
    	
    	if($scope.validationErrors) {
    		delete $scope.validationErrors;
    	}
    	
    	var validationErrors = validationService.validateEventFields(event.info);
    	if(validationErrors.keys.length > 0) {
    		$scope.validationErrors = validationErrors;
    		console.log('validation errors', validationErrors);
    		return;
    	}
                
        if (!event._id || event._id === "new") {
            
            $http.post("/api/events", event, { headers: requestHeaders } )
            .success((response) => {
                
                $log.debug(response);
                
                $scope.eventChanged = false;
                $scope.showError = false;
                
                $scope.eventStatus = "created";
                $scope.firstLoad = "loading";
                $scope.editEvent = response.event._id;
                $scope.event = response.event;
                         
                $scope.eventExists = true;

                $rootScope.navigate('#/event/'+$scope.event._id);
                
                if (callback) { callback(response); }

            })
            .error((err) => {
                $scope.showError = true;
                $scope.errorMessage = err.message;
                $log.debug("Error: ", err);
            });

        } else {
            
            $http.put("/api/events", event, { headers: requestHeaders } )
            .success((response) => {
                
                $log.debug(response);
                
                $scope.eventChanged = false;
                $scope.showError = false;
                
                $scope.setEventStatus("saved");
                         
                $scope.eventExists = true;
                
                if (callback) { callback(response); }

            })
            .error((err) => {
                $scope.showError = true;
                $scope.errorMessage = err.message;
                $log.debug("Error: ", err);
            });
        
        }
    	
    	$log.debug(event);
    	
    };
    
    
    $scope.getEvent = () => {
		
		$scope.showError = false;
		
		$http.get("/api/events/"+$scope.eventId+"?kind=edit", { headers: requestHeaders } )
        .success((response) => {
				
            $log.debug(response);
            
            $rootScope.screenResponse(response, () => {
                
                if(response.status === "eventFound") {
                    $scope.firstLoad = "loading";
                    $scope.event = response.event;
                    $scope.eventStatus = "fetched";
                    $scope.eventExists = true;
                } else {
                    $scope.showError = true;
                    $scope.errorMessage = response.message;
                }
                
            });
        
        })
        .error((data) => {
            $log.debug("Error: ", data);
        });
			
	};
    
    
    $scope.initMap = () => {
		
		var mapCanvas = document.getElementById("map_canvas");
                        
        var mapOptions = {
        	center: new google.maps.LatLng($scope.event.info.place.coords.lat, $scope.event.info.place.coords.lng),
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
                        
        console.log(mapCanvas);
        
        var map = new google.maps.Map(mapCanvas, mapOptions);			
		var marker = new google.maps.Marker({
  			position: mapOptions.center,
  			map: map
		});
		
	};
	
    
    $scope.$watch("eventStartTime", (startTime) => {
        if(startTime) {
    		$scope.event.info.timeStart = startTime.getTime();
    		$scope.clearError("timeStart");
    	}
    }, true);
    
    $scope.$watch("eventEndTime", (endTime) => {
        if(endTime) {
    		$scope.event.info.timeEnd = endTime.getTime();
    		$scope.clearError("timeEnd");
    	}
    }, true);
    
    
    $timeout(() => {
    	
    	var input = document.getElementById("place-input");
    	
    	var options = {
            types: ["geocode"]
        };
        
    	var autocomplete = new google.maps.places.Autocomplete(input);
        
    	console.log(autocomplete);
    	
        google.maps.event.addListener(autocomplete, "place_changed", () => {
            
            var place = autocomplete.getPlace();
            
            $scope.$apply(() => {
                
                $scope.event.info.place = {
                    address: input.value,
                    vicinity: place.vicinity,
                    coords: {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    }
                };
                
                console.log($scope.event.info.place);
                
            });
            
        });
    	
    	
    }, 1000);
    
}]);
