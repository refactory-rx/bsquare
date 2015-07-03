controllers.controller('VerifyCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log',
		 function($rootScope, $scope, $routeParams, $http, $log) {
	
	$scope.verificationId = $routeParams.id;
	$log.debug('verify id: '+$scope.verificationId);
	
	$scope.verifyStatus = '';
    $scope.showError = false;
    $scope.errorMessage = '';
    
	$http.get('/api/verify/'+$scope.verificationId)
		.success(function(response) {
			
			$log.debug(response);
			
			$scope.verifyStatus = response.status;
			
			if(response.status != 'emailVerified') {
				$scope.showError = true;
				$scope.errorMessage = response.message;
			}
			
		})
		.error(function(data) {
			$scope.showError = true;
			$scope.verifyStatus = 'serverError';
			$scope.errorMessage = 'Connection or server error.';
			$log.debug('Error: ' + data);
		});
		    
}]);