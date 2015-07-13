controllers.controller(
    "LogregCtrl", 
    ["$rootScope", "$scope", "$routeParams", "$locale", "$http", "$cookies", "$location", "$log", 
        ($rootScope, $scope, $routeParams, $locale, $http, $cookies, $location, $log) => {
	
	$scope.appName = $scope.$parent.name;
    
	$scope.logregUser = {};
    $scope.logregProfile = {
        language: $rootScope.language
    };

    $scope.pwdField = {
        hidden: true
    };
    $scope.showError = false;
    $scope.errorMessage = "";
    $scope.pwdInputType = "password";
    
    $scope.init = () => {
		
		$log.debug("init logreg ctrl ("+$rootScope.logregStatus+")");
		
		if ($rootScope.logregStatus == 'loggedIn') {
			$rootScope.logregView = 'loggedIn';
		}
		
	};
	
    $scope.logreg = () => {
    	
    	$log.debug("logreg user:");
    	$log.debug($scope.logregUser);
    	
    	$scope.showError = false;
    	
    	$http.post('/api/login', $scope.logregUser)
        .success((response) => {
				
            $log.debug(response);
            
            $rootScope.logregStatus = response.status;
            
            if (response.status == 'new') {
                
                $rootScope.logregView = 'register';
                
            } else if (response.status == 'loggedIn') {
                
                $rootScope.logregView = 'loggedIn';
                loggedUser = response.user;
                $rootScope.loggedUser = loggedUser;
                $cookies.evxSesssionToken = loggedUser.token;
                $cookies.bsqUser = loggedUser.email;
                requestHeaders["session-token"] = loggedUser.token;
                requestHeaders["bsquare-user"] = loggedUser.email;
                console.log("logged in", response);
                
                $rootScope.navigate('#/app?view=findEvents');
                
            } else {
                
                $scope.showError = true;
                $scope.errorMessage = response.message;
            
            }
            
        })
        .error((data) => {
            $log.debug('Error: ' + data);
        });
    	
    	
    };
    
    
    $scope.register = () => {
    	
    	var user = $scope.logregUser;
    	
    	$log.debug("register user:");
    	$log.debug($scope.logregUser);
    	
    	var profile = $scope.logregProfile;    

    	var registration = {
    		user: $scope.logregUser,
        	profile: $scope.logregProfile,
        	loginImmediately: 'true'
        };
    	
    	$scope.showError = false;
    	
    	$http.post('/api/register', registration)
        .success((response) => {
				
            $log.debug(response);
            
            $rootScope.logregStatus = response.status;
            
            if(response.status === 'registered') {
                // CONTINUE TO POST-REG
            } else if(response.status === 'loggedIn') {
                 
                $rootScope.logregView = 'loggedIn';
                loggedUser = response.user;
                $rootScope.loggedUser = loggedUser;
                $cookies.evxSesssionToken = loggedUser.token;
                $cookies.bsqUser = loggedUser.email;
                requestHeaders["session-token"] = loggedUser.token;
                requestHeaders["bsquare-user"] = loggedUser.email;
                
                console.log("regged user", loggedUser);
                
                $rootScope.navigate('#/app?view=findEvents');
                
            } else {
                $scope.showError = true;
                $scope.errorMessage = response.message;
            }
            
        })
        .error((data) => {
            $log.debug('Error: ' + data);
        });
    	
    	
    };
    
    $scope.$watch('pwdField.hidden', (value) => {
        
        console.log('password field hidden: '+value);
        	
    	if(value === true) {
    		$scope.pwdInputType = 'password';
    	} else {
    		$scope.pwdInputType = 'text';
    	}
    	
    }, true);
    
    $scope.init();
    
}]);
