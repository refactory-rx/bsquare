controllers.controller(
    "EventFrontCtrl",
    ['$rootScope', '$scope', '$location', '$routeParams', '$http', '$log', '$timeout', '$filter', '$locale', '$translate',
    ($rootScope, $scope, $location, $routeParams, $http, $log, $timeout, $filter, $locale, $translate) => {

    $rootScope.setRootView("event");

    console.log($rootScope.app);

    $scope.order = {
        totalPrice: 0
    };

    $scope.refTrackerUrls = [];

    $rootScope.$watch("logregStatus", (value) => {

    	$log.debug('eventFront->$watch(logregStatus): value = '+value);

    	if(value !== "loggedIn") {

    		var queryParams = $location.search();
    		if(!queryParams.group) {
				delete $scope.groupTrackingUrl;
    		}

			delete $scope.refTrackingUrl;
			delete $scope.shareRef;
    	}

    });

    $scope.$watch("eventStatus", (eventStatus) => {

    	console.log("eventStatus: "+eventStatus);

    	if(eventStatus === "loaded") {
    		$scope.init();
    		$scope.initMap();
    	}

    }, true);

    $scope.init = () => {

        console.log("eventFront->init()");

        if(!$scope.imageScaled && $(document).width() > 660) {

            let eventImageContainer = $("#eventImageContainer");
            let eventImage = $("#eventImage");
            eventImage.load(() => {

                let img = eventImage.get(0);
                let imgWidth = img.naturalWidth;
                let imgHeight = img.naturalHeight;
                console.log("loaded event image: ", imgWidth+" x "+imgHeight);

                var imgRatio = imgWidth/imgHeight;
                var containerRatio = eventImageContainer.width() / eventImageContainer.height()
                if (imgRatio < containerRatio) {
                    eventImageContainer.css("display", "flex");
                    eventImage.css({ "height": "100%", "width": "auto" });
                } else {
                    eventImageContainer.css("display", "table-cell");
                }

                $scope.imageScaled = true;
                console.log("image processing", imgRatio, containerRatio);

            });

        }

        $scope.getTicketResources(() => {
    		$scope.updateOrder();
    	});

        $timeout(() => {

            var baseUrl = `${$rootScope.appUrl}/i?route=/event/${$scope.event._id}`;
	    	var queryParams = $location.search();

	    	a2a.init("page");

			console.log("get tracking urls:");
			console.log($rootScope.loggedUser);
            console.log("a2a", a2a);

            if (!$scope.refTracker) {

                if (queryParams.ref) {
                    $scope.refTrackerId = queryParams.ref;
                }

                $scope.getRefTracker();

            }

	    }, 500);

    };


    $scope.orderQty = (ticketResource, dir) => {

	    let quantity = ticketResource.orderQty;
	    if (dir === "+") {
	        quantity += 1;
	    } else if (dir === "-") {
	        if(quantity > 0) {
	            quantity -= 1;
	        }
	    }

	    ticketResource.orderQty = quantity;
	    $scope.updateOrder();

	};


    $scope.updateOrder = () => {

	    let totalPrice = 0;
	    let orderItems = [];
        let ticketsQty = 0;

        $scope.ticketResources.forEach(ticketResource => {

            var trId = ticketResource._id;
		    var trName = ticketResource.name;
		    var trPrice = ticketResource.price;
		    var qty = ticketResource.orderQty;
		    var price = ticketResource.price;

		    totalPrice += price*qty;
		    ticketsQty += qty;

		    var item = {
		        ticketResource: trId,
		        name: trName,
		        price: trPrice,
		        quantity: qty
		    };

		    if(qty > 0) {
		        orderItems.push(item);
		    }

		});

        $scope.ticketsQty = ticketsQty;
		$scope.order.items = orderItems;
		$scope.order.totalPrice = totalPrice;

	};


    $scope.placeOrder = () => {

		$scope.updateOrder();

        if($scope.order.items.length == 0) {
	        $scope.showEventError = true;
		    $scope.eventStatus = "error";
            $scope.eventErrorMessage = "The order is empty.";
            $scope.orderError = { message: "The order is empty." };
            return;
        }

		var orderRequest = {
			order: $scope.order,
			eventId: $scope.event._id,
			action: "new"
		};

		var queryParams = $location.search();

		$log.debug("place order");
		$log.debug(orderRequest);

		if($scope.refTrackerId) {
		    $scope.order.refTrackerId = $scope.refTrackerId;
		}

		if($scope.orderError) {
			delete $scope.orderError;
		}

		$http.post("/api/orders", orderRequest, { headers: requestHeaders } )
        .success((response) => {

            $log.debug(response);

            if(response.status == "orderCreated" || response.status == "orderFulfilled") {

                var order = response.order;
                $rootScope.navigate(`#/order/${order._id}`);

            } else {

                $scope.showEventError = true;
                $scope.eventStatus = "error";
                $scope.eventErrorMessage = response.message;

                $scope.orderError = response;

            }

        })
        .error((err) => {
            $log.debug("Error", err);
        });


	};


    $scope.getRefTracker = () => {

        var baseUrl = `${$rootScope.appUrl}/i?route=/event/${$scope.event._id}`;

        let params = {
            eventId: $scope.event._id
        };

        if ($scope.refTrackerId) {
            params.refTrackerId = $scope.refTrackerId;
        } else {
            if ($rootScope.loggedUser && $rootScope.logregStatus === "loggedIn") {
                params.userId = $rootScope.loggedUser.id;
            }
        }

        console.log("Get reftracker params", params);
	    $http.get("/api/reftrackers", { params: params, headers: requestHeaders } )
        .success((response) => {
            
            console.log("Reftracker response", response);
            $scope.refTrackerId = response.refTracker.uuid;
            $scope.refTracker = response.refTracker;
            for (let i = 1; i <= a2a.n; i++) {
                a2a[`n${i}`].linkurl = `${baseUrl}?ref=${$scope.refTrackerId}`;
            }

            $http.get(`/api/reftrackers/${$scope.refTrackerId}/rewardstats`, { headers: requestHeaders } )
            .success((response) => {
 
              console.log("Rewardstats response", response);
 
              let groupRewards = response.rewardStats.groupRewards;
              if (groupRewards) {
                  
                  groupRewards.conditions.forEach(condition => {
                      if (!condition.reached) {
                          condition.reached = 0;
                      } else if (condition.quantity < condition.reached) {
                          condition.reached = condition.quantity;
                      }
                  });

                  $scope.event.groupRewards = groupRewards;
              
              }
              
              let refRewards = response.rewardStats.refRewards;
              if (refRewards && refRewards[$scope.event._id]) {
                $scope.event.refRewards = refRewards[$scope.event._id];
              } else {
                $scope.event.refRewards = 0;
              }

            })
            .error((err) => {
                console.log("Error", err);
            });
        
        })
        .error((err) => {
            console.log("Error", err);
        });


	};


    $scope.setRewardDescription = function(condition) {
    	//console.log(condition);
        condition.hovered = true;
    	$scope.hoveredRewardCondition = condition;
    };

    $scope.resetRewardDescription = function(condition) {
    	//console.log(condition);
        condition.hovered = false;
    	delete $scope.hoveredRewardCondition;
    };

    $scope.setPointRewardDescription = function(reward) {
    	reward.hovered = true;
        $scope.hoveredPointReward = reward;
    	//console.log(condition);
    };

    $scope.resetPointRewardDescription = function(reward) {
    	//console.log(condition);
        reward.hovered = false;
    	delete $scope.hoveredPointReward;
    };

    $scope.testFormat = function() {
        return 'testtt';
    };

    $scope.formatTime = function(time) {

    	var date = new Date(time);
    	var formattedTime =
    		date.getFullYear()+'/'+
    		date.getMonth()+'/'+
    		date.getDate();

    	return $filter('date')(date, 'MMM dd, y');

    };


}]);
