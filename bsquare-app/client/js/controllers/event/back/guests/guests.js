controllers.controller('event.back.guests.GuestsCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout',
		 function($rootScope, $scope, $routeParams, $http, $log, $timeout) {
	
    
    $scope.viewUrl = 'parts/event/back/guests/listGuests.html';
    
    $scope.selection = {
        selectedUsers: [],
        allSelected: false
    };
    
    $scope.message = {};
    $scope.sentMessages = [];
    $scope.searchField = {};
    
    $scope.init = function() {
        //$scope.getGuests();
        $scope.getMessages();
    };
    
    $scope.getGuests = function() {
        
        $http.get('/api/events/'+$scope.event._id+'/guests', { headers: requestHeaders } )
		.success(function(response) {
		    console.log('guests response', response);
		    $scope.guests = response.guests;
		});
		
    };
    
    $scope.$watch('searchField.text', function(searchQuery) {
        $scope.searchGuests(searchQuery);
    }, true);
    
    $scope.searchGuests = function(query) {
        
        if(!query || query.length == 0) {
            $scope.getGuests();
        } else {
            
            if(query.length > 2) {
                $http.get('/api/events/'+$scope.event._id+'/guests?q='+query, { headers: requestHeaders } )
        		.success(function(response) {
        		    console.log('guests response', response);
        		    $scope.guests = response.guests;
        		});
            }
    		
        }
        
		
    };
    
    $scope.getMessages = function() {
        
        $http.get('/api/events/'+$scope.event._id+'/messages', { headers: requestHeaders } )
		.success(function(response) {
		    console.log('messages response', response);
		    $scope.sentMessages = response.messages;
		});
		
    };
    
    $scope.calcSelected = function() {
        
        var selectedUsers = [];
        
        for(var i=0; i<$scope.guests.length; i++) {
            if($scope.guests[i].isSelected) {
                selectedUsers.push($scope.guests[i]);
            }
        }
        
            if(selectedUsers.length === $scope.guests.length) {
                $scope.selection.allSelected = true;
            } else {
                $scope.selection.allSelected = false;
            }
            
            console.log(selectedUsers.length, $scope.guests.length, $scope.selection.allSelected);
            
            $scope.selection.selectedUsers = selectedUsers;
        
            
    };
    
    $scope.selectAll = function() {
        if($scope.selection.allSelected) {
            $scope.selection.selectedUsers = [];
            $scope.selection.allSelected = false;
            for(var i=0; i<$scope.guests.length; i++) {
                $scope.guests[i].isSelected = false;
            }
        } else {
            var selectedUsers = [];
            $scope.selection.allSelected = true;
            for(var i=0; i<$scope.guests.length; i++) {
                $scope.guests[i].isSelected = true;
                selectedUsers.push($scope.guests[i]);
            }
            $scope.selection.selectedUsers = selectedUsers;
        }
    };
    
    $scope.showMessageComposer = function() {
        $scope.viewUrl = 'parts/event/back/guests/writeMessage.html';
    };
    
    $scope.showGuestList = function() {
        $scope.viewUrl = 'parts/event/back/guests/listGuests.html';
    };
    
    $scope.showSentMessages = function() {
        $scope.viewUrl = 'parts/event/back/guests/sentMessages.html';
    };
    
    $scope.sendMessage = function(message, users) {
        
        var addresses = $scope.selection.selectedUsers.map(function(user) {
            return user.orderEmail;
        });
        
        $scope.message.eventId = $scope.event._id;
        $scope.message.to = addresses;
        $http.post('/api/events/'+$scope.event._id+'/messages', message, { headers: requestHeaders } )
		.success(function(response) {
		    console.log(response);
		    $scope.showGuestList();
		    $scope.getMessages();
		    $scope.message.text = '';
		    $scope.message.subject = '';
		});
		
        
    };
    
    $scope.init();
    
    
}]);