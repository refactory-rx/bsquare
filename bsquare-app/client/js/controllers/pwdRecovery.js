controllers.controller(
    "PwdRecoveryCtrl",
    ['$rootScope', '$scope', '$routeParams', '$http', '$cookies', '$location', '$log',
    ($rootScope, $scope, $routeParams, $http, $cookies, $location, $log) => {

	$scope.recoveryView = "recover";
	$scope.recoveryStatus = "start";
    $scope.recoveryRequest = {};
	$scope.changeRequest = {};
	$scope.hidePassword = true;
	$scope.showError = false;
	$scope.errorMessage = "";

	$scope.recoveryToken = $routeParams.recoveryToken;
    
    $rootScope.setRootView("recovery");

	if($scope.recoveryToken) {
		$scope.recoveryView = 'change';
	}

    $scope.recoverPassword = function() {

    	var recoveryRequest = $scope.recoveryRequest;
    	$log.debug("recoveryRequest:");
    	$log.debug(recoveryRequest);

    	$scope.showError = false;

    	$http.post('/api/recover', recoveryRequest)
			.success(function(response) {

				$log.debug(response);

				$scope.recoveryStatus = response.status;

				if(response.status == 'emailSent') {
					$scope.recoveryView = 'emailSent';
				} else {
					$scope.showError = true;
					$scope.errorMessage = response.message;
				}

			})
			.error(function(data) {
				$log.debug('Error: ' + data);
			});


    };


    $scope.changePassword = function() {

    	var changeRequest = $scope.changeRequest;
    	changeRequest.recoveryToken = $scope.recoveryToken;

    	$log.debug("changePassword:");
    	$log.debug(changeRequest);

    	$scope.showError = false;

    	$http.post("/api/password", changeRequest)
        .success(function(response) {

            $log.debug(response);

            $scope.recoveryStatus = response.status;

            if(response.status == 'pwdChanged') {
                $scope.recoveryView = 'changed';
            } else {
                $scope.showError = true;
                $scope.errorMessage = response.message;
            }

        })
        .error(function(data) {
            $log.debug('Error: ' + data);
        });


    };

    $scope.init();

}]);
