controllers.controller(
    "QuickEditEventCtrl",
    ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout', 'stringUtils', 'validationService',
    ($rootScope, $scope, $routeParams, $http, $log, $timeout, stringUtils, validationService) => {

	$scope.eventStatus = "init";

	$scope.eventView = "settings";
    $scope.showError = false;
    $scope.errorMessage = "";

    $scope.firstLoad = "";
    $scope.eventChanged = false;

    $scope.eventExists = false;

    $scope.event = {};

    $scope.viewHeight = 420;

    $scope.loadInit = (myEvent, firstLoad) => {

    	console.log("loadInit", firstLoad, myEvent);

    	if(myEvent) {

            $timeout(() => {

    			$scope.event = myEvent;

    			if(!$scope.event.info) {
    				$scope.event.info = {};
    			}

    			if(firstLoad) {
    	    		$scope.firstLoad = firstLoad;
    	    	} else {
    	    		$scope.firstLoad = "loading";
    	    	}

    			if(myEvent.info.title) {
    			    $scope.eventExists = true;
    			}

    			if($scope.event.info.timeStart) {
	                $scope.eventStartTime = new Date($scope.event.info.timeStart);
	    		}

	            if($scope.event.info.timeEnd) {
	                $scope.eventEndTime = new Date($scope.event.info.timeEnd);
	    		}

	    		if($scope.event.info.place) {
	                var input = document.getElementById("place-input");
	                console.log($scope.event);
	                input.value = $scope.event.info.place.address;
	            }

    			$log.debug(`loadInit called for ${myEvent._id}`);

    		}, true);

    	}


    };

    $scope.updateView = (params) => {

    	if(params.view === "myEvents" && params.action) {
    		if(params.action === "new") {
    			$scope.eventStatus = "new";
    			$scope.event = {};
    		} else {
    			$scope.eventId = params.action;
    		}
    	}

    };

    $scope.setView = (view) => {

    	$scope.eventView = view;

    	if(view === "settings") {
    		$rootScope.changeEditViewHeight(420);
    	}

    	$log.debug("eventView -> "+$scope.eventView);

    };
    
    $scope.setError = (key, error) => {

        if (!$scope.validationErrors) {
            $scope.validationErrors = {
                keys: []
            };
        }
        
        if ($scope.validationErrors.keys.indexOf(key) === -1) {
            $scope.validationErrors.keys.push(key);
        }

        $scope.validationErrors[key] = error;

    };

    $scope.clearError = (field) => {

    	if($scope.validationErrors) {

    		delete $scope.validationErrors[field];

    		var keyIndex = -1;
    		for(var i=0; i<$scope.validationErrors.keys.length; i++) {
    			if($scope.validationErrors.keys[i] == field) {
    				keyIndex = i;
    				break;
    			}
    		}

    		if(keyIndex != -1) {
    			$scope.validationErrors.keys.splice(keyIndex, 1);
    			if($scope.validationErrors.keys.length === 0) {
    				delete $scope.validationErrors;
    			}
    		}

    	}

    };

    $scope.submit = () => {

        var event = $scope.event;
        $scope.saveEvent(event);

    };


    $scope.saveEvent = (event, callback) => {

    	console.log("quick-save event");

    	$scope.eventStatus = "";
    	$scope.showError = false;

    	if($scope.validationErrors) {
    		delete $scope.validationErrors;
    	}

    	var validationErrors = validationService.validateEventFields(event);
    	if(validationErrors.keys.length > 0) {
    		$scope.validationErrors = validationErrors;
    		console.log("validation errors", validationErrors);
    		return;
    	}

        if (!event._id || event._id === "new") {

            $http.post("/api/events", event, { headers: requestHeaders } )
            .success((response) => {

                $log.debug(response);

                $scope.eventChanged = false;
                $scope.showError = false;

                $scope.eventStatus = "created";
                $scope.firstLoad = "loading";
                $scope.editEvent = response.event._id;
                $scope.event = response.event;

                $scope.eventExists = true;

                $rootScope.navigate(`#/event/${$scope.event._id}`);

                if (callback) { callback(response); }

            })
            .error((err) => {
                $scope.showError = true;
                $scope.errorMessage = err.message;
                $log.debug("Error: ", err);
                if (err.message === "invalid_or_duplicate_slug") {
                    $scope.setError("slug", err.message);
                }
            });

        } else {

            $http.put("/api/events", event, { headers: requestHeaders } )
            .success((response) => {

                $log.debug(response);

                $scope.eventChanged = false;
                $scope.showError = false;

                $scope.setEventStatus("saved");

                $scope.eventExists = true;

                if (callback) { callback(response); }

            })
            .error((err) => {
                $scope.showError = true;
                $scope.errorMessage = err.message;
                $log.debug("Error: ", err);
                if (err.message === "invalid_or_duplicate_slug") {
                    $scope.setError("slug", err.message);
                }
            });

        }

    	$log.debug(event);

    };


    $scope.getEvent = () => {

		$scope.showError = false;

		$http.get(`/api/events/${$scope.eventId}?kind=edit`, { headers: requestHeaders } )
        .success((response) => {

            $log.debug(response);

            $rootScope.screenResponse(response, () => {

                if(response.status === "eventFound") {
                    $scope.firstLoad = "loading";
                    $scope.event = response.event;
                    $scope.eventStatus = "fetched";
                    $scope.eventExists = true;
                } else {
                    $scope.showError = true;
                    $scope.errorMessage = response.message;
                }

            });

        })
        .error((data) => {
            $log.debug("Error: ", data);
        });

	};

    $scope.getSlug = (title) => {

		$http.get(`/api/events/slug?title=${title}`, { headers: requestHeaders } )
        .success((response) => {
            console.log("getSlug response", response);
        })
        .error((err) => {
            $log.debug("Error: ", err);
        });

    };

    $scope.checkSlug = (slug) => {

        $scope.clearError("slug");

		$http.get(`/api/events/slug?slug=${slug}`, { headers: requestHeaders } )
        .success((response) => {
            console.log("checkSlug response", response);
            if (!response.available) {
                $scope.setError("slug", "duplicate_slug");
            }
        })
        .error((err) => {
            $log.debug("Error: ", err);
            $scope.setError("slug", err.message);
        });

    };

    $scope.getSlugs = (title) => {

		$http.get(`/api/events/slug?title=${title}`, { headers: requestHeaders } )
        .success((response) => {
            console.log("getSlugs response", response);
            $scope.slugOptions = response.slugs;
            $scope.event.slug = response.slugs[response.slugs.length - 1];
        })
        .error((data) => {
            $log.debug("Error: ", data);
        });

    };

    $scope.initMap = () => {

		var mapCanvas = document.getElementById("map_canvas");

        var mapOptions = {
        	center: new google.maps.LatLng($scope.event.info.place.coords.lat, $scope.event.info.place.coords.lng),
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        console.log(mapCanvas);

        var map = new google.maps.Map(mapCanvas, mapOptions);
		var marker = new google.maps.Marker({
  			position: mapOptions.center,
  			map: map
		});

	};

    $scope.$watch("event", (value) => {

    	console.log($scope.eventStatus, $scope.firstLoad);

    	if(value) {

    		if($scope.firstLoad === "loaded") {

	    		$log.debug("event changed");
	        	$scope.eventChanged = true;
	        	$scope.eventStatus = "changed";

    		}

    		else if($scope.firstLoad === "loading" || $scope.firstLoad === "preloaded") {
        		$scope.firstLoad = "loaded";
        	}

    		else if($scope.firstLoad === "") {
        		$scope.firstLoad = "loading";
        	}


    	}


    }, true);
    
    $scope.$watch("event.slug", (slug) => {

        console.log("slug changed", slug);
        
        let slugs = $scope.slugOptions;
        if (slug && !(slugs && slugs.length > 0 && slugs[slugs.length - 1] === slug)) {
            $scope.checkSlug(slug);
        }

    }, true);
    
    $scope.$watch("event.info.title", (title) => {

        console.log("title changed", title);

        if (title) {
            $scope.getSlugs(title);
        }

    }, true);

    $scope.$watch("app.route", (value) => {

    	if(value) {
    		$scope.updateView(value.params);
    	}

    }, true);

    $scope.$watch("eventStartTime", (startTime) => {
        if(startTime) {
    		$scope.event.info.timeStart = startTime.getTime();
    		$scope.clearError("timeStart");
    	}
    }, true);

    $scope.$watch("eventEndTime", (endTime) => {
        if(endTime) {
    		$scope.event.info.timeEnd = endTime.getTime();
    		$scope.clearError("timeEnd");
    	}
    }, true);

    $scope.$on('$routeUpdate', (current, next) => {
    	$scope.updateView(next.params);
    });

    $timeout(() => {

    	var input = document.getElementById("place-input");

    	var options = {
            types: ["geocode"]
        };

    	var autocomplete = new google.maps.places.Autocomplete(input);

    	console.log(autocomplete);

        google.maps.event.addListener(autocomplete, "place_changed", () => {

            let vicinity = null;
            let place = autocomplete.getPlace();
            let addr_components = place.address_components;

            for (let i = 0; i < addr_components.length; i++) {
                var types = addr_components[i].types;
                if (types.indexOf("locality") != -1 || types.indexOf("administrative_area_level_3") != -1) {
                    vicinity = addr_components[i].long_name;
                    break;
                }
            }

            console.log("full place", place);
             
            $scope.$apply(() => {
                
                $scope.event.info.place = {
                    
                    address: input.value,
                    vicinity: vicinity || place.vicinity,
                    
                    coords: {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    }
                };
                
                console.log($scope.event.info.place);
                
            });

        });


    }, 1000);

}]);
