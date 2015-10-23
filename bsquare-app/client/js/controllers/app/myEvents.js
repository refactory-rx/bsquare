controllers.controller(
    "MyEventsCtrl",
	['$rootScope', '$scope', '$location', '$routeParams', '$http', '$log', '$timeout',
    ($rootScope, $scope, $location, $routeParams, $http, $log, $timeout) => {

	$scope.myEventsStatus = '';
	$scope.myEventsView = '';
    $scope.showError = false;
    $scope.errorMessage = '';

    $scope.editEvent = '';
    $scope.currentAction = '';

    $scope.myEvents = [];
    $scope.myEventsTemplate = "parts/app/myEvents_blocked.html";
    $scope.contentTemplate = "parts/app/myEventsFull.html";

    $rootScope.editViewHeight = 420;

    $scope.init = () => {
    	$scope.getMyEvents();
    };

    $scope.$watch("app.views.selectedView", (value) => {

        if (value === "myEvents") {
            $scope.contentTemplate = "parts/app/myEventsFull.html";
        } else {
            $scope.contentTemplate = "parts/app/myEventsMin.html";
            $scope.newEventStatus = "";
        }

    }, true);

    $scope.$watch("app.route", (value) => {

    	if(value) {
    		$scope.updateView(value.params);
    	}

    }, true);


    $scope.$on('$routeUpdate', (current, next) => {
    	$scope.updateView(next.params);
    });


    $scope.$watch("logregStatus", (value) => {

        console.log("my events detected logreg status change", value);
        if(value === "loggedIn") {
            $scope.getMyEvents();
        } else if (value === "start") {
            $rootScope.navigate("/");
        }

    }, true);


    $rootScope.changeEditViewHeight = (editViewHeight) => {
        $rootScope.editViewHeight = editViewHeight;
        $scope.selectItem($scope.editEvent, true);
    };


    $scope.updateView = (params) => {

    	$log.debug("view="+params.view+", action="+params.action);

    	if (params.view === "myEvents") {

    		var action = params.action;

    		$scope.currentAction = action;

    		if (action === "new") {

    			if ($scope.editEvent === "" && $scope.eventsStatus === "") {

    				$scope.editEvent = "new";

    			} else {

    				$scope.editEvent = "new";
    				$scope.getMyEvents();

                }

	    	} else {

	    		if (action) {
	    			$scope.editEvent = action;
	    		} else {
	    			$scope.editEvent = "";
	    		}

	    		$scope.resetItems();
	    	    $scope.selectItem($scope.editEvent);

	    	}

    	} else if (params.view === "myTickets" || params.view === "findEvents") {

    		$scope.resetItems();

    		//$timeout(function() {

    			$scope.editEvent = "";
    			$scope.arrangeItems();

    		//});


    	}


    };

    $scope.resetItems = () => {

    		var newEventIndex;

    		for(var i=0; i<$scope.myEvents.length; i++) {
    			if($scope.myEvents[i]._id === 'new') {
    				newEventIndex = i;
    				break;
    			}
    		}

    		if(newEventIndex) {
    			$scope.myEvents.splice(newEventIndex, 1);
    			$("#new").remove();
    		}

    		/*
    		var myEvents = [];
			var myOldEvents = $scope.myEvents;

			for(var i=0; i<myOldEvents.length; i++) {
				if(myOldEvents[i]._id != 'new') {
					myEvents.push(myOldEvents[i]);
				}
			}

			$scope.myEvents = myEvents;

    	*/


		console.log('myEvents reset');

    };

    $scope.getMyEvents = () => {

        $scope.errors = null;

    	$http.get("/api/events?kind=own", { headers: requestHeaders } )
        .success((response) => {

			$log.debug("getMyEvents response", response);

            $rootScope.screenResponse(response, () => {

				$scope.eventsStatus = response.status;

				if (response.status === "ok") {

					var myEvents = response.events;

					if ($scope.editEvent === "new") {
						var newEvent = {};
		    			newEvent._id = "new";
		    			newEvent.layout = "bw";
		    			myEvents.push(newEvent);
					}

					$scope.myEvents = myEvents;
                    $scope.myEventsTemplate = response.myEventsTemplate;

    	            var now = (new Date()).getTime();

                    $scope.myEvents.forEach(event => {

                        if (event.status) {
                            event.eventStatus = event.status.toUpperCase();
                        } else {

                            if (event.info) {
                                if (event.info.timeStart > now) {
                                    event.eventStatus = "COMING";
                                } else if(event.info.timeEnd < now) {
                                    event.eventStatus = "ENDED";
                                } else if(event.info.timeStart < now < event.info.timeEnd) {
                                    event.eventStatus = "HAPPENING";
                                }
                            }

                        }

                    });

                    $scope.selectItem($scope.editEvent);

				} else {
					$scope.profileStatus = "error";
				}

			});

		})
        .error((data) => {
            $log.debug("Error: ", data);
            $scope.errors = [data];
		});

    };

    $scope.arrangeItems = function() {

        /*
    	var items = $scope.myEvents;

    	var top = 4;
    	var itemHeight = $rootScope.app.views.myEvents === 0 ? 66 : 40;

    	$log.debug('Arrange items: '+items.length);

    	for(var i=0; i < items.length; i++) {

    		if(items[i]) {
	    		var itemElement = $('#'+items[i]._id);
	    		itemElement.css('top', top+'px');
	    		itemElement.css('height', itemHeight+'px');
	    		top += itemHeight + 4;
    		}

    	}

    	$('#myEventListContainer').css('height', (top+4)+'px');
    	$('#eventScrollContainer').slimScroll({
	    	height: 'auto'
	    });
        */

    };

    $scope.selectItem = function(id) {

    	$scope.editEvent = id;

        if (!id) {
            return;
        }

        let delay = 100;
        if (id === "new") {
            delay = 1000;
        }

        $timeout(() => {
            $("#myEventsContent").scrollTop($("#"+id).position().top);
        }, delay);

    };

    $scope.getTemplate = function(event) {
    	if(event._id == $scope.editEvent) {
    		return 'parts/app/quickEditEvent.html';
    	} else {
    		return 'parts/app/myEvent.html';
    	}
    };

    $scope.init();

}]);
