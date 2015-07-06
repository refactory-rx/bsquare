controllers.controller("ProfileCtrl",
    ["$rootScope", "$scope", "$routeParams", "$http", "$log",
    ($rootScope, $scope, $routeParams, $http, $log) => {

	$scope.profileStatus = "";
    $scope.profileChanged = false;
    $scope.showError = false;
    $scope.errorMessage = "";

    $scope.$watch("savedProfile", (value) => {
        
        $log.debug("savedProfile value", value);
        
    	if(value && $scope.profile) {
    		$log.debug("changed");
    		$scope.profileChanged = true;
    		$scope.profileStatus = "changed";
    	}

    	$scope.profile = value;

    }, true);

    $rootScope.$watch("logregStatus", (value) => {

    	$log.debug("profile::logregStatus -> "+value);
        if(value === "loggedIn") {
            $scope.getProfile();
        }

    }, true);


	$scope.getProfile = () => {

		$scope.showError = false;

		$log.debug("getting the profile ... xxx");

		$http.get("/api/profile", { headers: requestHeaders } )
			.success((response) => {

				$log.debug(response);

				$rootScope.screenResponse(response, () => {
                    
                    $log.debug("profile response", response);
					if(response.status == "gotProfile") {
						$scope.savedProfile = response.profile;
					} else {
						$scope.profileStatus = "error";
					}

					$http.get("/api/refstats", { headers: requestHeaders } )
            			.success((response) => {

            				$log.debug(response);
            				$scope.profile.refStats = response.refStats;

            			})
            			.error((data) => {
            				$log.debug("Error: " + data);
            			});

				});

			})
			.error((data) => {
				$log.debug("Error: " + data);
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
