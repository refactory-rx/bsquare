controllers.controller("AppCtrl", 
    ['$rootScope', '$scope', '$location', '$routeParams', '$http', '$log', '$timeout', '$filter',
        ($rootScope, $scope, $location, $routeParams, $http, $log, $timeout, $filter) => {
	
	$scope.appStatus = '';
    $scope.showError = false;
    $scope.errorMessage = '';
    
    $scope.viewTemplate = "parts/app/findEvents.html";

    /*
    $rootScope.$watch('logregStatus', function(value) {
        
        $log.debug('logreg status = '+value);
        
    	if(value !== undefined) {
    		
    		if(value == 'start') {
    			//$scope.selectMainView('findEvents');
    		} else if(value == 'loggedIn') {
    		    $rootScope.navigate('#/app?view=findEvents');
    		}
    		
    	}
    	
    }, true);
    */
    
    $scope.$watch('app.route', function(value) {
    	
    	$log.debug('app.route changed');
    	$log.debug(value);
    	
    	if(value !== undefined) {
    		$scope.updateView(value.params);
    	}
    	
    }, true);
    
    $scope.$on('$routeUpdate', function(current, next) {
    	
    	$log.debug('$routeUpdate triggered');
    	$log.debug(current, next);
    	$scope.updateView(next.params);
    	
    });
    
    
    $scope.updateView = function(params) {
    	
    	var queryParams = $location.search();
    	$log.debug('queryParams:');
    	$log.debug(queryParams);
    	var view = queryParams.view;
    	var face = queryParams.face;
    	
    	if(view) {
    		
    		if(face === undefined) {
        		
        		if(view == 'settings' || view == 'logreg') {
        	        $rootScope.setRootView('back');
        		} else {
        		    $rootScope.setRootView('front');
        		}
        		
    		}
    		
    		$scope.selectMainView(view);
    	
    	}
    	
    	if(face) {
    		$rootScope.setRootView(face);
    	}
    	
    };
    
    
    $scope.init = function() {
    	
    	var params = $routeParams;
    	$log.debug(params);
    	
    	if(params.view !== undefined) {
    	    $scope.updateView(params);
    	}
    	
    	$scope.getPromoEvents();
    	
    };
    
    $scope.updateEvents = function(events) {
    	$scope.events = events;
    };
    
    $scope.formatTime = function(time) {
    	
    	var date = new Date(time);
    	var formattedTime = 
    		date.getFullYear()+'/'+
    		date.getMonth()+'/'+
    		date.getDate();
    	
    	return $filter('date')(date, 'MMM dd, y');
    	
    };
    
    $scope.getPromoEvents = function() {
    	
    	$http.get('/api/events/promo', { headers: requestHeaders } )
		.success(function(response) {
			
			$log.debug(response);
			$scope.promoEvents = response.events;
		
		})
		.error(function(data) {
			$log.debug('Error: ' + data);
		});
		
    },
    
    $scope.selectMainView = function(view) {
    	
    	if(view == 'findEvents') {
    		
    		$rootScope.app.views.findEvents = 0;
    		$rootScope.app.views.myEvents = 1;
    		$rootScope.app.views.myTickets = 2;
    	    $scope.viewTemplate = "parts/app/findEvents.html";

    	} else if(view == 'myEvents') {
        
            $rootScope.app.views.findEvents = 1;
    		$rootScope.app.views.myEvents = 0;
    		$rootScope.app.views.myTickets = 2;
    	    $scope.viewTemplate = "parts/app/myEvents.html";
        
        } else if(view == 'myTickets') {
        
            $rootScope.app.views.findEvents = 1;
    		$rootScope.app.views.myEvents = 2;
    		$rootScope.app.views.myTickets = 0;
    	    $scope.viewTemplate = "parts/app/myTickets.html";
        
        }
        
        if (view === "findEvents") {
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
        
    	$timeout(function() {
    		$scope.setViewContentHeight('findEvents');
    		$scope.setViewContentHeight('myEvents');
    		$scope.setViewContentHeight('myTickets');
    	}, 1100);
    	
    	
    	$rootScope.app.views.selectedView = view;
    	
    };
    
    $scope.setViewContentHeight = function(view) {
    	
    	var contentHeight = $('.'+view).height() - $('.'+view+' .columnHeader').height() - 15;
    	console.log('.'+view+' .panelContent => ' + $('.'+view).height() + ' - '+$('.'+view+' .columnHeader').height()+' - 15 = '+contentHeight);
    	$('.'+view+' .panelContent').height(contentHeight);
    		
    };
    
	$scope.getProfile = function() {
		
		$scope.showError = false;
		$log.debug('app->getProfile');
		
		$http.get('/api/profile', { headers: requestHeaders } )
			.success(function(response) {
				
				$log.debug(response);
				
				$rootScope.screenResponse(response, function() {
					
					if(response.status == 'gotProfile') {
					} else {
						$scope.appStatus = 'error';
					}
					
				});
			
			})
			.error(function(data) {
				$log.debug('Error: ' + data);
			});
			
	};
	
	$scope.init();
	
	/*
	$scope.setupTransitions = function() {
		
		var card = $("#card");
		var sides = card.find("figure");
		
		var cardEl = card.get(0);
		var myEventsEl = sides.get(0);
		var loginEl = sides.get(1);
		
		cardEl.addEventListener( 
			     'webkitTransitionEnd', 
			     function( event ) { 
			    	 if(event.propertyName == '-webkit-transform') {
			    		 console.log(event); 
			    	 } 
			     }, false );
		
		//console.log(cardEl);
		//console.log(myEventsEl);
		//console.log(loginEl);
		
	};
	
	setTimeout($scope.setupTransitions, 1000);
	*/
	
}]);
