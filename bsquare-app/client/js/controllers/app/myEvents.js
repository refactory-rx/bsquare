controllers.controller(
    'MyEventsCtrl', 
	['$rootScope', '$scope', '$location', '$routeParams', '$http', '$log', '$timeout',
    ($rootScope, $scope, $location, $routeParams, $http, $log, $timeout) => {
	
	$scope.myEventsStatus = '';
	$scope.myEventsView = '';
    $scope.showError = false;
    $scope.errorMessage = '';
    
    $scope.editEvent = '';
    $scope.currentAction = '';
    
    $scope.myEvents = [];
    $scope.myEventsTemplate = "parts/app/myEvents_blocked.html";

    $rootScope.editViewHeight = 420;

    
    $scope.init = () => {
    	$scope.getMyEvents();
    };
    
    
    $scope.$watch('app.views.selectedView', function(value) {
    	
    	if(value) {
    		if(value !== 'myEvents') {
    			$scope.newEventStatus = '';
    			$log.debug('view changed ('+value+'), newEventStatus -> '+$scope.newEventStatus);
    		}
    	}
    	
    }, true);
    
    $scope.$watch('app.route', (value) => {
    	
    	if(value) {
    		$scope.updateView(value.params);
    	}
    	
    }, true);
    
    
    $scope.$on('$routeUpdate', (current, next) => {
    	$scope.updateView(next.params);
    });
    
    
    $scope.$watch('logregStatus', (value) => {
    	
    	if(value) {
    		if(value == 'loggedIn') {
    			$scope.getMyEvents();
    		}
    	}
    	
    }, true);
    
    
    $rootScope.changeEditViewHeight = (editViewHeight) => {
        $rootScope.editViewHeight = editViewHeight;
        $scope.selectItem($scope.editEvent, true);
    };
    
    
    $scope.updateView = (params) => {
    	
    	$log.debug('view='+params.view+', action='+params.action);
    	
    	if(params.view == 'myEvents') {
    		
    		var action = params.action;
    		
    		$scope.currentAction = action;
    		
    		if(action == 'new') {
	    		
    			if($scope.editEvent === '' && $scope.eventsStatus === '') {
    				
    				$scope.editEvent = 'new';
    			
    			} else {
    				
    				$scope.editEvent = 'new';
    				$scope.getMyEvents();
    				
    				/*
    				var newEvent = {};
    				newEvent._id = 'new';
    				newEvent.layout = 'bw';
	    			$scope.editEvent = 'new';
	    			
    				var myEvents = $scope.myEvents;
    				myEvents.push(newEvent);
    				
    				$scope.myEvents = myEvents;
					
					
    				$timeout(function() {
    					$scope.selectItem('new');
    				});
    				*/
	    			
    			}
    			
	    	} else {
	    		
	    		
	    		if(action) {
	    			$scope.editEvent = action;
	    		} else {
	    			$scope.editEvent = '';
	    		}
	    		
	    		$scope.resetItems();
	    		
	    		//$timeout(function() {	
	    			
	    			$scope.selectItem($scope.editEvent);
	    			
	    		//});
	    		
	    		
	    	}
    		
    	} else if(params.view == 'myTickets' || params.view == 'findEvents') {
    		
    		$scope.resetItems();
    		
    		//$timeout(function() {
    			
    			$scope.editEvent = '';
    			$scope.arrangeItems();
    			
    		//});
    		
    		
    	}
    	
    	
    };
    
    $scope.resetItems = () => {
    		
    		var newEventIndex;
    		
    		for(var i=0; i<$scope.myEvents.length; i++) {
    			if($scope.myEvents[i]._id === 'new') {
    				newEventIndex = i;
    				break;
    			}	
    		}
    		
    		if(newEventIndex) {
    			$scope.myEvents.splice(newEventIndex, 1);
    			$("#new").remove();
    		}
    		
    		/*
    		var myEvents = [];
			var myOldEvents = $scope.myEvents;
			
			for(var i=0; i<myOldEvents.length; i++) {
				if(myOldEvents[i]._id != 'new') {
					myEvents.push(myOldEvents[i]);
				}
			}
			
			$scope.myEvents = myEvents;
			
    	*/
    	
    	
		console.log('myEvents reset');
    	
    };
    
    $scope.getMyEvents = () => {
    	
    	$http.get("/api/events?kind=own", { headers: requestHeaders } )
        .success((response) => {
			
			$log.debug(response);
			
            $rootScope.screenResponse(response, () => {
				
				$scope.eventsStatus = response.status;
				
				if(response.status == "ok") {
					
					var myEvents = response.events;
				    	
					if($scope.editEvent == "new") {
						var newEvent = {};
		    			newEvent._id = "new";
		    			newEvent.layout = "bw";
		    			myEvents.push(newEvent);
					}

                    $scope.myEventsTemplate = response.myEventsTemplate;
					$scope.myEvents = myEvents;
					
                    $timeout(() => {
						
						//$scope.selectItem($scope.editEvent);
						
						//$scope.arrangeItems();
						$scope.selectItem($scope.editEvent);
						
						/*
						if($scope.editEvent !== '') {
							$scope.selectItem($scope.editEvent, 'loaded');
						}
						*/
						
					});
					
				} else {
					$scope.profileStatus = "error";
				}
				
			});
		
		})
        .error((data) => {
			$log.debug("Error: ", data);
		});
    	
    };
    
    $scope.arrangeItems = function() {
    	
    	var items = $scope.myEvents;
    	
    	var top = 4;
    	var itemHeight = $rootScope.app.views.myEvents === 0 ? 66 : 40;
    	
    	$log.debug('Arrange items: '+items.length);
    	
    	for(var i=0; i<items.length; i++) {
    		
    		if(items[i]) {
	    		var itemElement = $('#'+items[i]._id);
	    		itemElement.css('top', top+'px');
	    		itemElement.css('height', itemHeight+'px');
	    		top += itemHeight + 4;
    		}
    	
    	}
    	
    	$('#myEventListContainer').css('height', (top+4)+'px');
    	$('#eventScrollContainer').slimScroll({
	    	height: 'auto'
	    });
    	
    };
    

    $scope.selectItem = function(id, rearrange) {
    	
    	if(rearrange !== true) {
    	    $rootScope.editViewHeight = 420;
    	}
    	
    	var top = 4;
    	var itemHeight = $rootScope.app.views.myEvents === 0 ? 66 : 40;
    	
    	var items = $scope.myEvents;
    	
    	if(id && id !== '') {
    		
	    	var selectedItem = $('#'+id);
	    	
	    	selectedItem.css('z-index', '1');
	    	selectedItem.css('top', top+'px');
	    	selectedItem.css('height', $rootScope.editViewHeight+'px');
	    	
	    	top += $rootScope.editViewHeight + 4;
	    	$log.debug('Add edit view height: '+$rootScope.editViewHeight);
	    	
    	}
    	
    	$scope.editEvent = id;
    	
    	for(var i=0; i<items.length; i++) {
    		
    		var itemElement = $('#'+items[i]._id);
    		
    		if(items[i]._id != id) {
    			
    			itemElement.css('z-index', '0');
    			itemElement.css('top', top+'px');
    			itemElement.css('height', itemHeight+'px');
    			top += itemHeight + 4;
    			
    			$log.debug('Add 44');
    			
    		}
    		
    	}
    	
    	$log.debug('set total height: '+(top+4));
    	$('#myEventListContainer').css('height', (top+4)+'px');
    	$('#eventScrollContainer').slimScroll({
	    	height: 'auto'
	    });
    	$('#eventScrollContainer').slimScroll({ scrollTo: '0px' });
    	
    };
    
    $scope.getTemplate = function(event) {
    	if(event._id == $scope.editEvent) {
    		return 'parts/app/quickEditEvent.html';
    	} else {
    		return 'parts/app/myEvent.html';
    	}
    };

    $scope.init();
    
}]);
