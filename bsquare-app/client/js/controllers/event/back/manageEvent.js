controllers.controller('ManageEventCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout', 'validationService',
		 function($rootScope, $scope, $routeParams, $http, $log, $timeout, validationService) {
	
	$scope.eventView = 'manageInfo';
	$scope.eventViewUrlPrefix = 'parts/event/back/';
	$scope.eventViewUrl = $scope.eventViewUrlPrefix + 'info/manageInfo.html';
	
    $scope.showError = false;
    $scope.errorMessage = '';
    
    $scope.eventExists = false;
    
    $scope.viewHeight = 420;
    
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
    	
        if(view == 'manageInfo') {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + 'info/manageInfo.html';
        } else if(view == 'manageTickets') {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + 'tickets/manageTickets.html';
        } else if(view == 'payout') {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + 'payout/payout.html';
        } else if(view == 'manageLayout') {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + 'layout/manageLayout.html';
        } else if(view == 'manageSignup') {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + 'signup/manageSignup.html';
        } else if(view == 'dashboard') {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + 'dashboard/dashboard.html';
        } else if(view == 'manageMarketing') {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + 'marketing/manageMarketing.html';
        } else if(view == 'manageOrders') {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + 'orders/manageOrders.html';
        } else if(view == 'guests') {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + 'guests/guests.html';
        } else {
            $scope.eventViewUrl = $scope.eventViewUrlPrefix + 'info/manageInfo.html';
        }
    	
    	$log.debug('eventView -> '+$scope.eventView);
    	
    };
   
    
    $scope.saveEvent = function(event, callback) {
    	
    	$scope.showError = false;
    	
    	var saveEventRequest = {
    		event: event
    	};
    	
    	$log.debug(saveEventRequest);
    	
    	$http.post('/api/events', saveEventRequest, { headers: requestHeaders } )
			.success(function(response) {
			
			$log.debug(response);
			
			$rootScope.screenResponse(response, function() {
				
				if(response.status == 'eventSaved' || response.status == 'eventCreated') {
					
					$scope.eventChanged = false;
					$scope.showError = false;
					
					if(response.status == 'eventCreated') {
						
						$scope.eventStatus = 'created';
						$scope.firstLoad = 'loading';
						$scope.editEvent = response.event._id;
						$scope.event = response.event;
					
					} else {
						
						$scope.setEventStatus('saved');
					
					}
					
					$scope.eventExists = true;
					
				} else {
					$scope.showError = true;
					$scope.errorMessage = response.message;
				}
				
				if(callback) {
				    callback(response);
				}
				
			});
		
		})
		.error(function(data) {
			$log.debug('Error: ' + data);
		});
    	
    	$log.debug(event);
    	
    };
	
	
    
}]);