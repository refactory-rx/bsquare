controllers.controller("SettingsCtrl",
    ["$rootScope", "$scope", "$routeParams", "$http", "$log", "$translate",
    ($rootScope, $scope, $routeParams, $http, $log, $translate) => {
  

  $scope.settingsView = "profile";
  $scope.viewTemplates = {
    "profile": "parts/app/profile.html",
    "rewards": "parts/app/rewards.html"
  };
  
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

    if(value === "loggedIn") {
      $scope.getProfile();
    }

  }, true);

  
  $scope.setView = (view) => {
    $scope.settingsView = view;
  }

	$scope.getProfile = () => {

		$scope.showError = false;

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

            $log.debug("refstats resp", response);
            const refRewards = response.refRewards;
            $scope.refStats = {
              rewards: refRewards,
              earned: 0,
              used: 0
            };
            
            Object.keys(refRewards).forEach(eventId => {
              $scope.refStats.earned += refRewards[eventId].total;
            });

            console.log("compiled refstats", $scope.refStats);

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
