controllers.controller('ProfileCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log',
		 function($rootScope, $scope, $routeParams, $http, $log) {
	
	
	$scope.profile = undefined;
	$scope.savedProfile = undefined;
	$scope.profileStatus = '';
    $scope.profileChanged = false;
    $scope.showError = false;
    $scope.errorMessage = '';
    
    
    $scope.$watch('savedProfile', function(value) {
    	
    	if(value !== undefined && $scope.profile !== undefined) {
    		$log.debug('changed');
    		$scope.profileChanged = true;
    		$scope.profileStatus = 'changed';
    	}
    	
    	$scope.profile = value;
    	
    }, true);
    
    
    $rootScope.$watch('logregStatus', function(value) {
    	
    	$log.debug('logregStatus -> '+value);
    	
    	if(value !== undefined) {
    	    if(value == 'loggedIn') {
    	        $scope.getProfile();
    	    }
    	}
    	
    }, true);
    
    
	$scope.getProfile = function() {
		
		$scope.showError = false;
		
		$log.debug('getting profile...');
		
		$http.get('/api/profile', { headers: requestHeaders } )
			.success(function(response) {
				
				$log.debug(response);
				
				$rootScope.screenResponse(response, function() {
					
					if(response.status == 'gotProfile') {
						$scope.savedProfile = response.profile;
					} else {
						$scope.profileStatus = 'error';
					}
					
					$http.get('/api/refstats', { headers: requestHeaders } )
            			.success(function(response) {
            				
            				$log.debug(response);
            				$scope.profile.refStats = response.refStats;
            				
            			})
            			.error(function(data) {
            				$log.debug('Error: ' + data);
            			});
					
				});
			
			})
			.error(function(data) {
				$log.debug('Error: ' + data);
			});
			
	};
	
	
	$scope.saveProfile = function() {
		
		$scope.showError = false;
		
		var saveProfileRequest = {
			profile: $scope.profile
		};
		
		$http.post('/api/profile', saveProfileRequest, { headers: requestHeaders } )
			.success(function(response) {
				
				$log.debug(response);
				
				$rootScope.screenResponse(response, function() {
				
					if(response.status == 'profileSaved') {
						$scope.profileChanged = false;
						$scope.profileStatus = 'saved';
						$scope.showError = false;
					} else {
						$scope.showError = true;
						$scope.profileStatus = 'error';
						$scope.errorMessage = response.message;
					}
					
				});
			
			})
			.error(function(data) {
				$log.debug('Error: ' + data);
			});
		
	};
    
	$scope.getProfile();
        
}]);