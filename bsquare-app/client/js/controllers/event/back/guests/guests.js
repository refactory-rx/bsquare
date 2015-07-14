controllers.controller(
    "event.back.guests.GuestsCtrl", 
    ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout',
    ($rootScope, $scope, $routeParams, $http, $log, $timeout) => {
	
    
    $scope.viewUrl = 'parts/event/back/guests/listGuests.html';
    
    $scope.selection = {
        selectedUsers: [],
        allSelected: false
    };
    
    $scope.message = {};
    $scope.sentMessages = [];
    $scope.searchField = {};
    
    $scope.init = () => {
        //$scope.getGuests();
        $scope.getMessages();
    };
    
    $scope.getGuests = () => {
        
        $http.get(`/api/events/${$scope.event._id}/guests`, { headers: requestHeaders } )
        .success((response) => {
		    console.log("guests response", response);
		    $scope.guests = response.guests;
		});
		
    };
    
    $scope.$watch("searchField.text", (searchQuery) => {
        $scope.searchGuests(searchQuery);
    }, true);
    
    $scope.searchGuests = (query) => {
        
        if(!query || query.length === 0) {
            $scope.getGuests();
        } else {
            
            if(query.length > 2) {
                $http.get(`/api/events/${$scope.event._id}/guests?q=${query}`, { headers: requestHeaders } )
                .success((response) => {
        		    console.log("guests q response", response);
        		    $scope.guests = response.guests;
        		});
            }
    		
        }
        
		
    };
    
    $scope.getMessages = () => {
        
        $http.get(`/api/events/${$scope.event._id}/messages`, { headers: requestHeaders } )
        .success((response) => {
		    console.log("messages response", response);
		    $scope.sentMessages = response.messages;
		});
		
    };
    
    $scope.calcSelected = () => {
        
        var selectedUsers = [];

        $scope.guests.forEach(guest => {
            if(guest.isSelected) {
                selectedUsers.push(guest);
            }
        });
        
        if(selectedUsers.length === $scope.guests.length) {
            $scope.selection.allSelected = true;
        } else {
            $scope.selection.allSelected = false;
        }
        
        console.log(selectedUsers.length, $scope.guests.length, $scope.selection.allSelected);
        $scope.selection.selectedUsers = selectedUsers;
            
    };
    
    $scope.selectAll = () => {
        
        if($scope.selection.allSelected) {
            $scope.selection.selectedUsers = [];
            $scope.selection.allSelected = false;
            for(var i=0; i < $scope.guests.length; i++) {
                $scope.guests[i].isSelected = false;
            }
        } else {
            var selectedUsers = [];
            $scope.selection.allSelected = true;
            for(var i=0; i < $scope.guests.length; i++) {
                $scope.guests[i].isSelected = true;
                selectedUsers.push($scope.guests[i]);
            }
            $scope.selection.selectedUsers = selectedUsers;
        }

    };
    
    $scope.showMessageComposer = () => {
        $scope.viewUrl = "parts/event/back/guests/writeMessage.html";
    };
    
    $scope.showGuestList = () => {
        $scope.viewUrl = "parts/event/back/guests/listGuests.html";
    };
    
    $scope.showSentMessages = () => {
        $scope.viewUrl = "parts/event/back/guests/sentMessages.html";
    };
    
    $scope.sendMessage = (message, users) => {
        
        var addresses = $scope.selection.selectedUsers.map(user => user.orderEmail);
        
        $scope.message.to = addresses;
        $http.post(`/api/events/${$scope.event._id}/messages`, message, { headers: requestHeaders } )
        .success((response) => {
		    console.log(response);
		    $scope.showGuestList();
		    $scope.getMessages();
		    $scope.message.text = "";
		    $scope.message.subject = "";
        })
        .error((err) => {
            console.log("Error", err);
        });
		
        
    };
    
    $scope.init();
    
    
}]);
