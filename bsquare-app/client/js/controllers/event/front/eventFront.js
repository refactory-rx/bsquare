controllers.controller('EventFrontCtrl', 
		['$rootScope', '$scope', '$location', '$routeParams', '$http', '$log', '$timeout', '$filter', '$locale', '$translate',
		 function($rootScope, $scope, $location, $routeParams, $http, $log, $timeout, $filter, $locale, $translate) {
	
	
    
    $rootScope.setRootView('event');
    
    console.log($rootScope.app);

	
    $scope.order = {
        totalPrice: 0
    };
    
    $scope.refTrackerUrls = [];
    
    $rootScope.$watch('logregStatus', function(value) {
    	
    	$log.debug('eventFront->$watch(logregStatus): value = '+value);
    	
    	if(value != 'loggedIn') {
    		
    		var queryParams = $location.search();
    		if(queryParams.group === undefined) {
				delete $scope.groupTrackingUrl;
    		}
			
			delete $scope.refTrackingUrl;
			delete $scope.shareRef;
    	}
    	
    });
    
    $scope.$watch('eventStatus', function(eventStatus) {
    	
    	console.log('eventStatus: '+eventStatus);
    	
    	if(eventStatus === 'loaded') {
    		$scope.init();
    		$scope.initMap();
    		//$timeout($scope.initMap(), 1000);
    	}
    		
    }, true);
    
    
    $scope.init = function() {
    	
    	console.log('eventFront->init()');
    	
    	$scope.getTicketResources(function() {
    		$scope.updateOrder();
    	});
    	
    	$timeout(function() {
	    	
	    	var baseUrl = $rootScope.appUrl + '/event/' + $scope.event._id;
	    	var queryParams = $location.search();
	    	
	    	/*
	    	var a = document.createElement('script');
	    	a.type = 'text/javascript';
	    	a.async = true;
	    	a.src = '//static.addtoany.com/menu/page.js';
	    	var s = document.getElementsByTagName('script')[0];
	    	s.parentNode.insertBefore(a, s);
	    	*/
			
	    	a2a.init('page');
	    		
			console.log('get tracking urls:');
			console.log($rootScope.loggedUser);
				
			if($rootScope.loggedUser && $rootScope.loggedUser.loginStatus == 'loggedIn') {
						
				$scope.getRefTrackerUrl('group');
				$scope.getRefTrackerUrl('ref');
					
			} else {
				
				/*
				a2a.total = 2;
				a2a.n = 3;
				*/
				
				if(queryParams.group !== undefined) {
				    $scope.refTrackerUrls.group = baseUrl + '?group=' + queryParams.group;
				    $scope.refTrackerUrls.ref = $scope.refTrackerUrls.group;
				    a2a['n'+(a2a.total-1)].linkurl = $scope.refTrackerUrls.group;
				    a2a['n'+(a2a.n-1)].linkurl = $scope.refTrackerUrls.ref;
				}
					
				if(queryParams.ref !== undefined) {
				   	$scope.refTrackingUrl = baseUrl + '?ref=' + queryParams.ref;
			    	a2a['n'+(a2a.n-1)].linkurl = $scope.refTrackerUrls.ref;
				}
			}
	    		
	    }, 500);
	    	
    };
    
	
	$scope.orderQty = function(ticketResource, dir) {
	    
	    var quantity = ticketResource.orderQty;
	    if(dir == '+') {
	        quantity += 1;
	    } else if(dir == '-') {
	        if(quantity > 0) {
	            quantity -= 1;
	        }
	    }
	    
	    ticketResource.orderQty = quantity;
	    $scope.updateOrder();
	    
	};
	
	
	$scope.updateOrder = function() {
	    
	    var totalPrice = 0;
	    var orderItems = [];
		
		for(var i=0; i<$scope.ticketResources.length; i++) {
		    
		    var ticketResource = $scope.ticketResources[i];
		    var trId = ticketResource._id;
		    var trName = ticketResource.name;
		    var trPrice = ticketResource.price;
		    var qty = ticketResource.orderQty;
		    var price = ticketResource.price;
		    
		    totalPrice += price*qty;
		    
		    var item = {
		        ticketResource: trId,
		        name: trName,
		        price: trPrice,
		        quantity: qty
		    };
		    
		    if(qty > 0) {
		        orderItems.push(item);
		    }
		    
		}
		
		$scope.order.items = orderItems;
		$scope.order.totalPrice = totalPrice;
		
	};
	
	
	$scope.placeOrder = function() {
		
		$scope.updateOrder();

        if($scope.order.items.length == 0) {
	        $scope.showEventError = true;
		    $scope.eventStatus = 'error';
            $scope.eventErrorMessage = "The order is empty.";
            $scope.orderError = { message: "The order is empty." };
            return;
        }

		var orderRequest = {
			order: $scope.order,
			eventId: $scope.event._id,
			action: 'new'
		};
		
		var queryParams = $location.search();
		
		$log.debug('place order');
		$log.debug(orderRequest);
		
		if(queryParams.group !== undefined) {
		    $scope.order.groupTrackerId = queryParams.group; 
		}
		
		if(queryParams.ref !== undefined) {
		    $scope.order.refTrackerId = queryParams.ref; 
		}
		
		if($scope.orderError) {
			delete $scope.orderError;
		}
		
		$http.post('/api/orders', orderRequest, { headers: requestHeaders } )
			
			.success(function(response) {
				
				$log.debug(response);
				
				if(response.status == 'orderCreated' || response.status == 'orderFulfilled') {
					
					var order = response.order;
					$rootScope.navigate('#/order/'+order._id);
					
				} else {
					    
					$scope.showEventError = true;
					$scope.eventStatus = 'error';
					$scope.eventErrorMessage = response.message;
					
					$scope.orderError = response;
					
				}
				
			})
			
			.error(function(data) {
				$log.debug('Error: ' + data);
			});
		
		
	};
	
	
	$scope.getRefTrackerUrl = function(type) {
	    
	    if(!$rootScope.loggedUser || $rootScope.loggedUser.loginStatus != 'loggedIn') {
	    	return;
	    }
	    
	    var baseUrl = $rootScope.appUrl + '/event/' + $scope.event._id;
	    
	    console.log($rootScope.loggedUser);
	    
	    var getRefTrackerRequest = {
	        refTracker: {
	        	userId: $rootScope.loggedUser.id,
	        	eventId: $scope.event._id,
	        	type: type
	    	}
	    };
	    
	    $http.post('/api/reftrackers', getRefTrackerRequest, { headers: requestHeaders } )
			.success(function(response) {
				
				$log.debug(response);
				
				$rootScope.screenResponse(response, function() {

					console.log('process reftracker response...');
					
					if(response.status == 'refTrackerCreated' || response.status == 'refTrackerExisted' || response.status == 'refTrackersFound') {
						
						var refTracker = response.refTrackers[0];
						
						$scope.refTrackerUrls[refTracker.type] = baseUrl + '?'+refTracker.type+'=' + refTracker._id;
	    				var refTrackerUrl = $scope.refTrackerUrls[refTracker.type];
						
						$timeout(function() {
							
							/*
							a2a.total = 2;
							a2a.n = 3;
							
							//delete a2a.n3;
							delete a2a.n4;
							delete a2a.n5;
							delete a2a.n6;
							*/
							
		    				if(refTracker.type == 'group') {
		    					console.log('set group tracking url to: '+a2a['n'+(a2a.total-1)].linkurl+' -> '+refTrackerUrl);
		    					a2a['n'+(a2a.total-1)].linkurl = refTrackerUrl;
		    				} else {
		    					console.log('set ref tracking url to: '+a2a['n'+(a2a.n-1)].linkurl+' -> '+refTrackerUrl);
		    					a2a['n'+(a2a.n-1)].linkurl = refTrackerUrl;
		    					$scope.shareRef = true;
		    				}
		    				
						}, 1000);
						
	    				
					} else {
						$scope.groupTrackingErrorMessage = response.message;
					}
					
				});
			
			})
			.error(function(data) {
				$log.debug('Error: ' + data);
			});
			
	    
	};
    
    
    $scope.setRewardDescription = function(condition) {
    	//console.log(condition);
    	$scope.hoveredRewardCondition = condition;
    };
    
    $scope.resetRewardDescription = function() {
    	//console.log(condition);
    	delete $scope.hoveredRewardCondition;
    };
    
    $scope.setPointRewardDescription = function(reward) {
    	$scope.hoveredPointReward = reward;
    	//console.log(condition);
    };
    
    $scope.resetPointRewardDescription = function() {
    	//console.log(condition);
    	delete $scope.hoveredPointReward;
    };
    
    $scope.testFormat = function() {
        return 'testtt';
    };
    
    $scope.formatTime = function(time) {
    	
    	var date = new Date(time);
    	var formattedTime = 
    		date.getFullYear()+'/'+
    		date.getMonth()+'/'+
    		date.getDate();
    	
    	return $filter('date')(date, 'MMM dd, y');
    	
    };
    
    /*
    $timeout(function() {
        var lang = $locale.id.split('-')[0];
        console.log('use language: '+lang);
        $translate.use(lang);
    }, 3000);
    */

}]);
