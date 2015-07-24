controllers.controller(
    "FindEventsCtrl", 
    ['$rootScope', '$scope', '$location', '$routeParams', '$http', '$log', '$timeout', '$filter',
    ($rootScope, $scope, $location, $routeParams, $http, $log, $timeout, $filter) => {
	
    $scope.events = [];
    $scope.eventStats = {};

	$scope.showEventsError = false;
	
	$scope.eventsStatus = '';
	$scope.eventsView = '';
    $scope.eventsErrorMessage = '';
    
    $scope.searchField = {};
    
    $scope.init = () => {
    	$scope.getEvents();
    };

    $scope.templateUrl = "parts/app/findEventsFull.html";

    $scope.$watch("app.views.selectedView", (value) => {
    	
        if (value === "findEvents") {
            $scope.templateUrl = "parts/app/findEventsFull.html";
    		$scope.searchField.text = "";
    		$scope.getEvents($routeParams.q);
        } else {
            $scope.templateUrl = "parts/app/findEventsMin.html";
    		$scope.getEventStats();
    	}
    	
    }, true);
    
    $scope.$watch("params", (value) => {
    	
    	var params = $scope.params;
    	
    	$log.debug('find params:');
    	$log.debug(params);
    		
    	if(params) {
    		$scope.getEvents();
    	}
    	
    }, true);
    
    
    $scope.getEvents = (searchText) => {
    	
    	let url = "/api/events";
    	if(searchText) {
    		url += "?q="+searchText;
    	}
    	
    	$http.get(url, { headers: requestHeaders } )
        .success((response) => {
			
            $log.debug(response);
            
            $rootScope.screenResponse(response, () => {
                
                $scope.eventsStatus = response.status;
                
                if(response.status === "ok") {
                    
                    let events = response.events;
                    
                    if(events.length > 1) {
                        events.splice(1, 0, { promo: true });
                    }
                    
                    if(events.length > 4) {
                        events.splice(4, 0, { promo: true });
                    }
                    
                    $scope.events = events;
                    //$scope.updateEvents(events);
                    
                } else {
                    $scope.profileStatus = "error";
                }
                
            });
		
		})
        .error((data) => {
			$log.debug("Error: ", data);
		});
    	
    };
    
    $scope.getEventStats = () => {
    	
        $http.get("/api/events/stats", { headers: requestHeaders } )
        .success((response) => {
			
            $log.debug(response);
            
            if(response.status === "ok") {
                $scope.eventStats = response.eventStats;
            } 
		
		})
        .error((data) => {
			$log.debug("Error: ", data);
		});
    	
    };
    
    $scope.adjustVerticalImages = () => {
        
        $scope.events.forEach(event => {
             
            let eventImage = $("#event-img-"+event._id);
            eventImage.load(() => {
                
                let img = eventImage.get(0);
                let imgWidth = img.naturalWidth;
                let imgHeight = img.naturalHeight;
                console.log("loaded event image: ", imgWidth+" x "+imgHeight); 
                
                if (imgWidth < imgHeight) {
                    eventImage.css({ "max-height": "120px" });
                }

            });
        
        });     
                    
    };

    $scope.formatTime = function(time) {
    	
    	var date = new Date(time);
    	var formattedTime = 
    		date.getFullYear()+'/'+
    		date.getMonth()+'/'+
    		date.getDate();
    	
    	return $filter('date')(date, 'MMM dd, y');
    	
    };
    
    $scope.openEvent = function(event) {
    	
    	$rootScope.navigate('#/event/'+event._id);
    	
    };
    
    $scope.searchEvents = function() {
    	
    	var searchText = $scope.searchField.text;
    	console.log('searching events: '+searchText);
    	
    	$scope.getEvents(searchText);
    
    	
    }
    
    //$scope.init();
    
}]);
