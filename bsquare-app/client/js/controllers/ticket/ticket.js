controllers.controller('TicketEntryCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log',
		 function($rootScope, $scope, $routeParams, $http, $log) {
	
	$rootScope.setRootView('ticket');
	
	$scope.ticketId = $routeParams.id;
	$scope.ticket = {};
	
    $scope.$watch('ticketId', function(value) {
        
        var ticketId = $scope.ticketId;
        
        if(ticketId !== undefined) {
            
            $log.debug('ticketId set: '+ticketId);
            $scope.getTicket(ticketId);
            
        }
        
    }, true);
    
    
	$scope.getTicket = function(id) {
		
		$scope.showTicketError = false;
		
		$log.debug('getting ticket...');
		
		$http.get('/api/tickets/'+id, { headers: requestHeaders } )
		.success(function(response) {
				
			$log.debug(response);
				
			if(response.status == 'ticketsFound') {
				
				$scope.ticket = response.data[0];
				
			} else {
			    $scope.showTicketError = true;
				$scope.ticketStatus = 'error';
				$scope.ticketErrorMessage = response.message;
			}
			
		})
		.error(function(data) {
		    
			$log.debug('Error: ' + data);
		    $scope.showTicketError = true;
			$scope.ticketStatus = 'error';
			$scope.ticketErrorMessage = 'Network error while getting ticket.';
			
		});
		
			
	};
	
	
	
}]);

controllers.controller('TicketFrontCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$filter',
		 function($rootScope, $scope, $routeParams, $http, $log, $filter) {
	
	$rootScope.setRootView('ticketFront');
	
    $scope.showTicketError = false;
    $scope.ticketErrorMessage = '';
    $scope.ticketStatus = '';
    
	$scope.formatTime = function(time) {
		
		var date = new Date(parseInt(time));
    	return $filter('date')(date, 'MMM dd, y @ HH:mm');
			
	};
	
	$scope.useTicket = function() {
	    
	    $http.get('/api/tickets/'+$scope.ticket._id+'?use=admit', { headers: requestHeaders } )
		.success(function(response) {
				
			$log.debug(response);
				
			if(response.status == 'ticketUsed') {
					
				$scope.ticketStatus = 'used';
				$scope.ticket.status = 'used';
				
			} else {
				
				$scope.showTicketError = true;
				$scope.ticketStatus = 'error';
				$scope.ticketErrorMessage = response.message;
				
			}
				
				
		})
		.error(function(data) {
			$log.debug('Error: ' + data);
			$scope.showTicketError = true;
			$scope.ticketStatus = 'error';
			$scope.ticketErrorMessage = 'Network error while saving ticket.';
		});
	    
	};
    
        
}]);


controllers.controller('TicketBackCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log',
		 function($rootScope, $scope, $routeParams, $http, $log) {
	
	$rootScope.setRootView('ticketBack');
	
}]);