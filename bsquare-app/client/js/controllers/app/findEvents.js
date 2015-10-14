controllers.controller(
    "FindEventsCtrl", 
    ['$rootScope', '$scope', '$location', '$routeParams', '$http', '$log', '$timeout', '$filter',
    ($rootScope, $scope, $location, $routeParams, $http, $log, $timeout, $filter) => {
	
    $scope.events = [];
    $scope.eventStats = {};

	$scope.showEventsError = false;
	
	$scope.eventsStatus = '';
	$scope.eventsView = '';
    $scope.eventsErrorMessage = '';
    
    $scope.searchField = {};
    
    $scope.init = () => {
    	$scope.getEvents();
    };

    $scope.templateUrl = "parts/app/findEventsFull.html";

    $scope.$watch("app.views.selectedView", (value) => {
    	
        
        if (value === "findEvents") {
            $scope.templateUrl = "parts/app/findEventsFull.html";
    		$scope.searchField.text = "";
    		$scope.getEvents($routeParams.q);
            
            $timeout(() => {

                $(".findEventsContent").scroll(() => { 
                    
                    let scrollTop = $(".findEventsContent").scrollTop();
                    
                    if (scrollTop <= 256) {
                        $(".appHeader").css("height", 44+(256-scrollTop)+"px");
                        $("#jumbotron").css({ "opacity": ""+(1-(scrollTop/256)), "top": (30-(70*(scrollTop/256)))+"px" });
                        $("#jumbotron > div > h1").css("font-size", (39-(30*(scrollTop/256)))+"px");
                    } else {
                        $(".appHeader").css("height", "44px");
                        $("#jumbotron").css({ "opacity": "0", "top": "-40px" });
                        $("#jumbotron > div > h1").css("font-size", "9px");
                    }
                    
                    if (scrollTop > 120) {
                        $("#jumbotron a").css("display", "none");
                    } else { 
                        $("#jumbotron a").css("display", "inline-block");
                    }
                    
                });

                $('#appHeader').bind('mousewheel', (e) => {
                    
                    var scrollTo = (e.originalEvent.deltaY) + $('#findEventsContent').scrollTop();
                    
                    //console.log(e); 
                    //console.log("mousewheel", e.wheelDelta); 
                    //$("#findEventsContent").scrollTop(scrollTo);
                    //$("#findEventsContent").trigger(e);
                    //$("#findEventsContent").scrollTop(scrollTo);
                    
                });
                
                $("#appHeader").on("scrollstart", function(){
                      alert("Started scrolling!");
                });

                /*
                let headerElem = document.getElementById("appHeader");
                let targetElem = document.getElementById("findEventsContent");
                console.log("HEADER ELEM", headerElem);
                let eventKeys = [
                    "mousedown", 
                    "mousemove", 
                    "touchstart", 
                    "touchmove", 
                    "touchend"
                ];
                
                eventKeys.forEach(eventKey => {
                    headerElem.addEventListener(eventKey, (event) => {
                        targetElem.dispatchEvent(event);
                        //console.log("HEADER EVENT", event); 
                    }, true);          
                });
                */

            }, 1000);
        } else {
            $scope.templateUrl = "parts/app/findEventsMin.html";
    		$scope.getEventStats();
    	}
    	
    }, true);
    
    $scope.$watch("params", (value) => {
    	
    	var params = $scope.params;
    	
    	$log.debug('find params:');
    	$log.debug(params);
    		
    	if(params) {
    		$scope.getEvents();
    	}
    	
    }, true);
    
    
    $scope.getEvents = (searchText) => {
    	
    	let url = "/api/events";
    	if(searchText) {
    		url += "?q="+searchText;
    	}
    	
    	$http.get(url, { headers: requestHeaders } )
        .success((response) => {
			
            $log.debug(response);
            
            $rootScope.screenResponse(response, () => {
                
                $scope.eventsStatus = response.status;
                
                if(response.status === "ok") {
                    
                    let events = response.events;
                    
                    if(events.length > 1) {
                        events.splice(1, 0, { promo: true });
                    }
                    
                    if(events.length > 4) {
                        events.splice(4, 0, { promo: true });
                    }
                    
                    $scope.events = events;
                    //$scope.updateEvents(events);
                    
                } else {
                    $scope.profileStatus = "error";
                }
                
            });
		
		})
        .error((data) => {
			$log.debug("Error: ", data);
		});
    	
    };
    
    $scope.getEventStats = () => {
    	
        $http.get("/api/events/stats", { headers: requestHeaders } )
        .success((response) => {
			
            $log.debug(response);
            
            if(response.status === "ok") {
                $scope.eventStats = response.eventStats;
            } 
		
		})
        .error((data) => {
			$log.debug("Error: ", data);
		});
    	
    };
    
    $scope.adjustVerticalImages = () => {
        
        $scope.events.forEach(event => {
             
            let eventImage = $("#event-img-"+event._id);
            eventImage.load(() => {
                
                let img = eventImage.get(0);
                let imgWidth = img.naturalWidth;
                let imgHeight = img.naturalHeight;
                console.log("loaded event image: ", imgWidth+" x "+imgHeight); 
                
                if (imgWidth < imgHeight) {
                    eventImage.css({ "max-height": "120px" });
                }

            });
        
        });     
                    
    };

    $scope.formatTime = function(time) {
    	
    	var date = new Date(time);
    	var formattedTime = 
    		date.getFullYear()+'/'+
    		date.getMonth()+'/'+
    		date.getDate();
    	
    	return $filter('date')(date, 'MMM dd, y');
    	
    };
    
    $scope.openEvent = function(event) {
    	
    	$rootScope.navigate('#/event/'+event._id);
    	
    };
    
    $scope.searchEvents = function() {
    	
    	var searchText = $scope.searchField.text;
    	console.log('searching events: '+searchText);
    	
    	$scope.getEvents(searchText);
    
    	
    }
     
    //$scope.init();
    
}]);
