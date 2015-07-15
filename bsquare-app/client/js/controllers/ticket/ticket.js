controllers.controller(
    "TicketEntryCtrl",
    ['$rootScope', '$scope', '$routeParams', '$http', '$log',
    ($rootScope, $scope, $routeParams, $http, $log) => {

	$rootScope.setRootView("ticket");

	$scope.ticketId = $routeParams.id;
	$scope.ticket = {};

    $scope.$watch("ticketId", (value) => {

        var ticketId = $scope.ticketId;

        if(ticketId) {
            $log.debug("ticketId set: ", ticketId);
            $scope.getTicket(ticketId);
        }

    }, true);


    $scope.getTicket = (id) => {

		$scope.showTicketError = false;

		$log.debug("getting ticket");

		$http.get("/api/tickets/"+id, { headers: requestHeaders } )
        .success((response) => {

			$log.debug("get ticket response", response);

			if(response.status === "ok") {

				$scope.ticket = response.ticket;

			} else {
			    $scope.showTicketError = true;
				$scope.ticketStatus = "error";
				$scope.ticketErrorMessage = response.message;
			}

		})
        .error((data, res) => {
            
			$log.debug("Error: ", data, res);
		    $scope.showTicketError = true;
			$scope.ticketStatus = "error";
			$scope.ticketErrorMessage = "Network error while getting ticket.";

		});


	};



}]);

controllers.controller(
    "TicketFrontCtrl",
    ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$filter',
        ($rootScope, $scope, $routeParams, $http, $log, $filter) => {

	$rootScope.setRootView("ticketFront");

    $scope.showTicketError = false;
    $scope.ticketErrorMessage = "";
    $scope.ticketStatus = "";

    $scope.formatTime = (time) => {

		let date = new Date(parseInt(time));
    	return $filter("date")(date, "MMM dd, y @ HH:mm");

	};

    $scope.useTicket = () => {
        console.log("adm ticket headers", requestHeaders);
	    $http.put("/api/tickets/"+$scope.ticket._id, null, { headers: requestHeaders } )
        .success((response) => {
			$log.debug(response);
            $scope.ticketStatus = "used";
            $scope.ticket.status = "used";
		})
        .error((data) => {
			$log.debug("Error: ", data);
			$scope.showTicketError = true;
			$scope.ticketStatus = "error";
			$scope.ticketErrorMessage = data.message;
		});

	};

}]);


controllers.controller(
    "TicketBackCtrl",
    ['$rootScope', '$scope', '$routeParams', '$http', '$log',
    ($rootScope, $scope, $routeParams, $http, $log) => {

	$rootScope.setRootView("ticketBack");

}]);
