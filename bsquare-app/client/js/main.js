let placeSearch;

let loggedUser = null;
let requestHeaders = {};

let controllers = angular.module("controllers", []);
let filters = angular.module("filters", []);

filters.filter("truncate", () => {
    
    return (text, length, end) => {
        
        if(isNaN(length)) {
            length = 10;
        }
        
        if(!end) {
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

    if (location.search) {

        let routeIndex = location.search.indexOf("?route=");

        if (routeIndex != -1) {
            let routeSubstr = location.search.substring(routeIndex + 7);
            let route = unescape(routeSubstr);
            console.log("ROUTE "+route);
            location.href = `/#${route}`;
        }

    }

    let lang = $locale.id.split('-')[0];
        
    if(lang === "fi" || lang === "en") {
        $translate.use("fi");
        $rootScope.language = "fi";
    }
    
    $scope.name = "Main Application";
    
    $rootScope.appUrl = "http://bsq.co";
    $rootScope.imgBaseUrl = "http://bsq.co/img"; 
    $rootScope.filesBaseUrl = "http://bsq.co/files";
    $rootScope.imageServer = "http://bsq.co";
    $rootScope.fileServer = "http://bsq.co";
    
    $rootScope.logregStatus = "start";
    $rootScope.logregView = "login";
    $rootScope.username = "";
    $rootScope.rootView = "events"; 
    $rootScope.hideHeader = false;
    $rootScope.og = {
        title: "Helppo tapa myydä liput",
        description: "Myy liput vaivattomasti ja pienin kustannuksin",
        image: `${$rootScope.imgBaseUrl}/BSQ-logo_small.png`,
        url: `${$rootScope.appUrl}`
    };
    
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
	
    $rootScope.setRootView = (view) => {

        $scope.regFirst = false;
        $rootScope.rootView = view;
        $rootScope.setJumbotron(view);
        if (view === "event") {
            $rootScope.hideHeader = true;
        } else {
            $rootScope.hideHeader = false;
        }

        console.log("rootview set to "+$rootScope.rootView);
    
    };
	
    $rootScope.setJumbotron = (view) => {
        console.log("SET VIEW", view);
        if (view === "events" || view === "front") {
            $(".appHeader").css("height", "300px");
            $("#jumbotron").css({ "opacity": "1.0", "top": "30px" });
            $("#jumbotron > div > h1").css("font-size", "39px");
            $("#jumbotron a").css("display", "inline-block");
            $("#jumbotron").css("display", "block");
        } else {    
            $(".appHeader").css("height", "44px");
            $("#jumbotron").css({ "opacity": "0", "top": "-40px" });
            $("#jumbotron > div > h1").css("font-size", "9px");
            $("#jumbotron").css("display", "none");
	    }
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
    
    $scope.createEvent = () => {
        console.log("create vent");
        if ($rootScope.logregStatus === "loggedIn") {
            window.location.href = "/#/app?view=myEvents&action=new";
        } else {
            $scope.regFirst = true;
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


var mainApp = angular.module(
    "mainApp", 
    [
        "controllers", 
        "filters", 
        "ngRoute", 
        "ngCookies", 
        "ngAnimate", 
        "angulike",
        "anguvideo",
        "ui.bootstrap.datetimepicker", 
        "pascalprecht.translate"
    ]
);

mainApp.config(
    
    [   
        "$routeProvider",
        ($routeProvider) => {
            
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

mainApp.config(($logProvider) => {
	$logProvider.debugEnabled(true);
});


mainApp.run(($rootScope, $location) => {
    $rootScope.location = $location;
});
