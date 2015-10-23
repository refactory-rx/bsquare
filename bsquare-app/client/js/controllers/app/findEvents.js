controllers.controller(
    "FindEventsCtrl",
    [
        "$rootScope", "$scope", "$location", "$routeParams", "$http", "$log", "$timeout", "$filter", "$translate",
        ($rootScope, $scope, $location, $routeParams, $http, $log, $timeout, $filter, $translate) => {

    $scope.events = [];
    $scope.eventStats = {};

	$scope.showEventsError = false;

	$scope.eventsStatus = '';
	$scope.eventsView = '';
    $scope.eventsErrorMessage = '';

    $scope.searchField = {};
    $scope.setLocation = false;
    $scope.setEventType = false;
    $scope.setEventTime = false;
    $scope.locationOptions = [];
    $scope.eventTypeOptions = [];
    $scope.eventTimeOptions = [
        { name: "today", label: $translate.instant("app.findEvents.time.today") },
        { name: "week", label: $translate.instant("app.findEvents.time.week") },
        { name: "month", label: $translate.instant("app.findEvents.time.month") }
    ];

    $scope.init = () => {
    	$scope.getEvents();
    };

    $scope.templateUrl = "parts/app/findEventsFull.html";

    $scope.$watch("app.views.selectedView", (value) => {


        if (value === "findEvents") {

            $scope.templateUrl = "parts/app/findEventsFull.html";
    		$scope.searchField.text = "";
    		$scope.getEvents({ q: $routeParams.q });
    		$scope.getEventStats();

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

                $("#appHeader").bind("mousewheel", (e) => {
                    var scrollTo = (e.originalEvent.deltaY) + $("#findEventsContent").scrollTop();
                    $("#findEventsContent").scrollTop(scrollTo);
                });

                $("#appHeader").bind("touchstart", (e) => {
                    $scope.touchStartY = e.originalEvent.touches[0].clientY;
                    console.log("Start tpuching at ", $scope.touchStartY);
                });

                $("#appHeader").bind("touchmove", (e) => {
                    var touchY = e.originalEvent.touches[0].clientY;
                    var deltaY = $scope.touchStartY - touchY;
                    $scope.touchStartY = touchY;
                    var scrollTo = deltaY + $("#findEventsContent").scrollTop();
                    $("#findEventsContent").scrollTop(scrollTo);
                });

            }, 1000);
        } else {
            $scope.templateUrl = "parts/app/findEventsMin.html";
    		$scope.getEventStats();
    	}

    }, true);

    $scope.$watch("params", (value) => {

    	var params = $scope.params;

    	$log.debug("find params:");
    	$log.debug(params);

    	if(params) {
    		$scope.getEvents();
    	}

    }, true);


    $scope.getEvents = (params) => {

        let options = { headers: requestHeaders };
        if (params) {
            options.params = params;
        }

        $http.get("/api/events", options)
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
                var eventTypes = Object.keys($scope.eventStats.types);
                $scope.eventTypeOptions = eventTypes
                .filter(type => type != "max")
                .map(type => { return { name: type, label: $translate.instant(`event.properties.type.${type}`) }; });
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

    $scope.formatTime = (time) => {

    	var date = new Date(time);
    	var formattedTime =
    		date.getFullYear()+"/"+
    		date.getMonth()+"/"+
    		date.getDate();

    	return $filter("date")(date, "MMM dd, y");

    };

    $scope.openEvent = (event) => {
    	$rootScope.navigate(`#/event/${event._id}`);
    };

    $scope.searchEvents = () => {

    	var searchText = $scope.searchField.text;
    	console.log("searching events: "+searchText);

        let params = {};

        if ($scope.searchLocation) {
            params["loc"] = $scope.searchLocation;
        }

        if ($scope.eventType) {
            params["type"] = $scope.eventType.name;
        }

        if ($scope.eventTime) {
            params["time"] = $scope.eventTime.name;
        }

        if (searchText) {
            params["q"] = searchText;
        }

    	$scope.getEvents(params);

    };

    $scope.changeLocation = () => {

        if ($scope.setLocation) {
            $scope.setLocation = false;
            return;
        }

        $scope.locationSearchStr = "";

        var eventLocations = Object.keys($scope.eventStats.locations);
        $scope.locationOptions = eventLocations.filter(location => location != "max");

        $scope.setEventTime = false;
        $scope.setEventType = false;
        $scope.setLocation = true;
    };

    $scope.selectLocation = (location) => {
        $scope.setLocation = false;
        $scope.searchLocation = location;
        $scope.locationSearchStr = "";
        $scope.locationOptions = [];
        $scope.searchEvents();
    };

    $scope.resetLocationSearch = () => {
        $scope.setLocation = false;
        $scope.locationSearchStr = "";
        delete $scope.searchLocation;
        $scope.searchEvents();
    };

    $scope.$watch("locationSearchStr", (locationSearchStr) => {

        var eventLocations = Object.keys($scope.eventStats.locations);
        if (!locationSearchStr || locationSearchStr === "") {
            $scope.locationOptions = eventLocations.filter(location => location != "max");
        } else {
            $scope.locationOptions = eventLocations.filter(location => {
                return location != "max" && location.indexOf(locationSearchStr) != -1;
            });
        }

    }, true);


    $scope.changeEventType = () => {

        if ($scope.setEventType) {
            $scope.setEventType = false;
            return;
        }

        $scope.setLocation = false;
        $scope.setEventTime = false;
        $scope.setEventType = true;

    };

    $scope.selectEventType = (type) => {
        $scope.setEventType = false;
        $scope.eventType = type;
        $scope.searchEvents();
    };

    $scope.resetEventType = () => {
        $scope.setEventType = false;
        delete $scope.eventType;
        $scope.searchEvents();
    };

    $scope.changeEventTime = () => {

        if ($scope.setEventTime) {
            $scope.setEventTime = false;
            return;
        }

        $scope.setLocation = false;
        $scope.setEventType = false;
        $scope.setEventTime = true;

    };

    $scope.selectEventTime = (time) => {
        $scope.setEventTime = false;
        $scope.eventTime = time;
        $scope.searchEvents();
    };

    $scope.resetEventTime = () => {
        $scope.setEventTime = false;
        delete $scope.eventTime;
        $scope.searchEvents();
    };

    //$scope.init();

}]);
