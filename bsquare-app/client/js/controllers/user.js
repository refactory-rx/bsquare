controllers.controller('UserCtrl', ['$scope', '$routeParams', '$http', function($scope, $routeParams, $http) {
	
	$scope.userId = $routeParams.id;
    
    $scope.updateUser = function() {
        
    	$http.get('/api/users/'+$scope.userId)
    		.success(function(data) {
    			$scope.order = data;
		    })
		    .error(function(data) {
		    	console.log('Error: ' + data);
		    });
    	
    };
    
    
    $scope.start = function() {
        
    	$scope.updateInterval = setInterval(function() {
            
            $scope.$apply(function() {
                $scope.updateUser();
            });
            
        }, 1000);
        
    };
        
        
}]);