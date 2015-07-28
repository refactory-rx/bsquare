controllers.controller(
    "ManageEventCtrl", 
    ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout', 'validationService',
        ($rootScope, $scope, $routeParams, $http, $log, $timeout, validationService) => {
	
	$scope.eventView = 'manageInfo';
	$scope.eventViewUrlPrefix = 'parts/event/back/';
	$scope.eventViewUrl = $scope.eventViewUrlPrefix + 'info/manageInfo.html';
	
    $scope.showError = false;
    $scope.errorMessage = '';
    
    $scope.eventExists = false;
    
    $scope.viewHeight = 420;
    
    $scope.$watch("app.route", (value) => {
    	
    	if(value) {
    		$scope.updateView(value.params);
    	}
    	
    }, true);
    
    $scope.$on("$routeUpdate", (current, next) => {
    	$scope.updateView(next.params);
    });
    
    
    $scope.updateView = (params) => {
    	
    	if(params.view === "myEvents" && params.action) {
    		if(params.action === "new") {
    			$scope.eventStatus = "new";
    			$scope.event = {};
    		} else {
    			$scope.eventId = params.action;
    		}
    	}
    	
    };
    
    
    $scope.setView = (view) => {
    	
    	$scope.eventView = view;
    	
        if(view === "manageInfo") {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + "info/manageInfo.html";
        } else if(view === "manageTickets") {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + "tickets/manageTickets.html";
        } else if(view === "payout") {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + "payout/payout.html";
        } else if(view === "manageLayout") {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + "layout/manageLayout.html";
        } else if(view === "manageSignup") {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + "signup/manageSignup.html";
        } else if(view === "dashboard") {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + "dashboard/dashboard.html";
        } else if(view === "manageMarketing") {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + "marketing/manageMarketing.html";
        } else if(view === "manageOrders") {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + "orders/manageOrders.html";
        } else if(view === "guests") {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + "guests/guests.html";
        } else {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + "info/manageInfo.html";
        }
    	
    	$log.debug("eventView -> ", $scope.eventView);
    	
    };
   
    
    $scope.saveEvent = (event, callback) => {
    	
    	$scope.showError = false;

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
        
    	
    };
	
	
    
}]);
