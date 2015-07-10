controllers.controller('MyTicketsCtrl', 
		['$rootScope', '$scope', '$location', '$routeParams', '$http', '$log', '$timeout', '$filter',
		 function($rootScope, $scope, $location, $routeParams, $http, $log, $timeout, $filter) {
	
	$scope.tickets = [];
	$scope.ticketsByEvent = [];
	
	$scope.showTicketsError = false;
	
	$scope.ticketsStatus = '';
	$scope.ticketsView = '';
    $scope.ticketsErrorMessage = '';
    
    $scope.params = undefined;
    
    $scope.init = function() {
    	$scope.getTickets();
    };
    
    $scope.$watch('logregStatus', function(value) {
    	
    	console.log('myTickets:logregStatus = '+value);
    	if(value == 'loggedIn') {
    		$scope.getTickets();
    	}
    		
    });
    
    $scope.getTickets = function() {
        
        $log.debug("loading my tickets");

    	$http.get('/api/tickets', { headers: requestHeaders } )
			.success(function(response) {
			
			$log.debug("tickets response", response);
			
			$rootScope.screenResponse(response, function() {
					
				$scope.ticketsStatus = response.status;
				
				if(response.status == "ok") {
					
					var tickets = response.tickets;
					$scope.updateTickets(tickets);
					
				} else {
					$scope.profileStatus = 'error';
				}
				
			});
		
		})
		.error(function(data) {
			$log.debug('Error: ' + data);
		});
    	
    };
    
    $scope.updateTickets = function(tickets) {
    	
    	$scope.tickets = tickets;
    	
    	var ticketsByEventName = {};
    	
    	for(var i=0; i<tickets.length; i++) {
    		
    		var orderTickets = ticketsByEventName[tickets[i].eventName];
    		if(!orderTickets) {
    			orderTickets = {
    				eventName: tickets[i].eventName,
    				orderId: tickets[i].orderId,
    				startTime: tickets[i].startTime,
    				eventPlace: tickets[i].eventPlace,
    				tickets: [],
    				ticketsByName: []
    			};
    			ticketsByEventName[tickets[i].eventName] = orderTickets;
    		}
    		
    		orderTickets.tickets.push(tickets[i]);
    		
    	}
    	
    	var eventNames = Object.getOwnPropertyNames(ticketsByEventName);
    	$scope.ticketsByEvent = [];
    	for(var i=0; i<eventNames.length; i++) {
    	    
            var eventTicketsInfo = {};

    		var eventTickets = ticketsByEventName[eventNames[i]];
    		var ticketsByResourceMap = {};
    		
    		console.log('eventTickets', eventTickets);
    		
    		for(var j=0; j<eventTickets.tickets.length; j++) {
    			
    			var ticketsByResource = ticketsByResourceMap[eventTickets.tickets[j].ticketResourceId];
    			
    			if(!ticketsByResource) {
    				
    				ticketsByResource = {
    					ticketResourceId: eventTickets.tickets[j].ticketResourceId,
    					ticketName: eventTickets.tickets[j].ticketName,
    					tickets: []
    				}
    				
    				ticketsByResourceMap[eventTickets.tickets[j].ticketResourceId] = ticketsByResource;
    				console.log(eventTickets.tickets[j].ticketResourceId+' mapped to '+ticketsByResource);
    				//console.log(ticketsByResourceMap);
    				
    			}
    			
    			ticketsByResource.tickets.push(eventTickets.tickets[j]);
    			
    		}
    		
    		var ticketResourceIds = Object.getOwnPropertyNames(ticketsByResourceMap);
    		//console.log(ticketsByResourceMap)
    		//console.log(ticketResourceIds);
    		
    		for(var j=0; j<ticketResourceIds.length; j++) {
    			eventTickets.ticketsByName.push(ticketsByResourceMap[ticketResourceIds[j]]);
    		}
    		
    		$scope.ticketsByEvent.push(eventTickets);
    	
    	}
    	
    	//console.log($scope.ticketsByEvent);
    	
    	
    };
    
    
    $scope.openTicket = function(ticket) {
    	
    	$rootScope.navigate('#/ticket/'+ticket._id);
    	
    };
    
    $scope.formatTime = function(time) {
    	
    	var date = new Date(parseInt(time));
    	var formattedTime = 
    		date.getFullYear()+'/'+
    		date.getMonth()+'/'+
    		date.getDate();
    	
    	return $filter('date')(date, 'MMM dd, y');
    	
    };
    
    
}]);
