var placeSearch;

var loggedUser = null;
var requestHeaders = {};

var controllers = angular.module('controllers', []);
var filters = angular.module('filters', []);

filters.filter('truncate', function () {
    
    return function (text, length, end) {
        
        if(isNaN(length)) {
            length = 10;
        }
        
        if(end === undefined) {
            end = "...";
        }
        
        if(text && (text.length <= length || text.length - end.length <= length)) {
            return text;
        } else {
            return String(text).substring(0, length-end.length) + end;
        }

    };
    
});

controllers.controller(
    "MainCtrl", 
    ["$rootScope", "$scope", "$route", "$routeParams", "$location", "$http", "$cookies", "$log", "$timeout", "$locale", "$translate",
    ($rootScope, $scope, $route, $routeParams, $location, $http, $cookies, $log, $timeout, $locale, $translate) => {
    
    let lang = $locale.id.split('-')[0];
        
    if(lang === "fi" || lang === "en") {
        $translate.use("fi");
        $rootScope.language = "fi";
    }
    
    $scope.name = "Main Application";
    
    $rootScope.appUrl = 'http://bsq.co/#';
    $rootScope.imgBaseUrl = 'http://bsq.co/img'; 
    $rootScope.filesBaseUrl = 'http://bsq.co/files';
    $rootScope.imageServer = 'http://bsq.co';
    $rootScope.fileServer = 'http://bsq.co';
    
    $rootScope.logregStatus = 'start';
    $rootScope.logregView = 'login';
    $rootScope.username = '';
    $rootScope.rootView = 'events';
    $scope.accountDropdownStatus = 'closed';
    
    $rootScope.app = {
        views: {
            findEvents: 0,
            myEvents: 1,
            myTickets: 2,
            selectedView: 'findEvents'
        }
    };
    
	requestHeaders["session-token"] = $cookies.evxSesssionToken;
	requestHeaders["bsquare-user"] = $cookies.bsqUser;
	requestHeaders["bsquare-language"] = $rootScope.language;
    	
    $rootScope.screenResponse = (response, callback) => {
		
		if(response.status === "unauthorized") {
			//$rootScope.navigate('#/app?view=findEvents');
		} else {
			callback();
		}
		
	};
	
    $scope.init = () => {
		
		$log.debug(requestHeaders);
		
		$http.get("/api", { headers: requestHeaders } )
        .success((response) => {
				
            $log.debug(response);
            
            if (response.status == "authorized") {
                
                loggedUser = response.user;
                if (response.profile) {
                    loggedUser.displayName = response.profile.displayName;
                }

                $rootScope.logregStatus = loggedUser.loginStatus;
                $rootScope.loggedUser = loggedUser;
                $log.debug("set logregStatus to "+$rootScope.logregStatus);
                
            }
            
            $rootScope.app.route = { params: $routeParams };
            
        })
        .error((data) => {
            $log.debug("Error: " + data);
        });
			
        $timeout(() => {
			$("body").css("width", "100%");
		}, 1000);
	    	
	};
	
    $scope.logout = () => {
		
		$http.get("/api/logout", { headers: requestHeaders })
        .success((response) => {
			
            $log.debug(response);
            
            if(response.success == 1) {
                requestHeaders["session-token"] = "";
                $cookies.evxSesssionToken = "";
                $cookies.bsqUser = "";
                $rootScope.logregStatus = "start";
                $rootScope.logregView = "login";
                delete $rootScope.loggedUser;
                $rootScope.setRootView("front");
            }
            
        })
        .error((data) => {
            $log.debug("Error: ", data);
        });
            
	};
	
	$rootScope.setRootView = function(view) {
    	$rootScope.rootView = view;
    	console.log('rootview set to '+$rootScope.rootView);
    };
	
    $rootScope.navigate = function(path) {
    	window.location.href = path;
	};
	
	$scope.openAccountDropdown = function() {
		if($scope.accountDropdownStatus != 'open') {
			//var width = $('#action-menu').width()+12;
			//$('#action-menu-dropdown').css('width', width+'px');
			$scope.accountDropdownStatus = 'open';
			setTimeout(function() {
				$("#dropdown-input").focus();	
			}, 100);
			
		} else {
			$scope.accountDropdownStatus = 'closed';
		}
	};
	
	$("#dropdown-input").blur(function() {
		$timeout(function() {
			console.log('blurred - '+$scope.accountDropdownStatus);
			$scope.$apply(function() {
				$scope.accountDropdownStatus = 'closed';	
			});	
		}, 300);
	});
	
	$scope.init();
	
}]);

var mainApp = angular.module('mainApp', ['controllers', 'filters', 'ngRoute', 'ngCookies', 'ngAnimate', 'angulike', 'ui.bootstrap.datetimepicker', 'pascalprecht.translate']);

mainApp.config(
    
    [   
        '$routeProvider',
        function($routeProvider) {
	        $routeProvider.when('/user/:id', { templateUrl: 'user.html', controller: 'UserCtrl' } )
	            .when('/front', { templateUrl: 'parts/front.html', controller: 'FrontCtrl' } )
	            .when('/app', { 
	            	templateUrl: 'parts/app/app.html', 
	            	controller: 'AppCtrl',
	            	reloadOnSearch: false
	            })
	            .when('/event/:id', { 
	            	templateUrl: 'parts/event/eventEntry.html', 
	            	controller: 'EventEntryCtrl',
	            	reloadOnSearch: false
	            })
	            .when('/order/:id', { 
	            	templateUrl: 'parts/order/orderEntry.html', 
	            	controller: 'OrderEntryCtrl',
	            	reloadOnSearch: false
	            })
	            .when('/ticket/:id', { 
	            	templateUrl: 'parts/ticket/ticketEntry.html', 
	            	controller: 'TicketEntryCtrl',
	            	reloadOnSearch: false
	            })
	            .when('/recover/:recoveryToken', { templateUrl: 'parts/recoverPassword.html', controller: 'PwdRecoveryCtrl' } )
	            .when('/recover', { templateUrl: 'parts/recoverPassword.html', controller: 'PwdRecoveryCtrl' } )
	            .when('/verify/:id', { templateUrl: 'parts/verifyEmail.html', controller: 'VerifyCtrl' } )
	            .when('/profile', { templateUrl: 'parts/editProfile.html', controller: 'ProfileCtrl' } )
	            .when('/tos', { templateUrl: 'parts/tos.html' } )
	            .when('/faq', { templateUrl: 'parts/faq.html' } )
	            .when('/support', { templateUrl: 'parts/support.html' } )
	            .otherwise( { redirectTo: '/app' } );
	    }
	   
	]

);

mainApp.config(function($logProvider){
	$logProvider.debugEnabled(true);
});

mainApp.run(function($rootScope, $location) {
	$rootScope.location = $location;
});
