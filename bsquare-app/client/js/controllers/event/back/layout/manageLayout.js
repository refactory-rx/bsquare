controllers.controller('event.back.layout.ManageLayoutCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout',
		 function($rootScope, $scope, $routeParams, $http, $log, $timeout) {
	
    
    $scope.saveLayout = function(layout) {
        
        var event = {
            _id: $scope.event._id,
            layout: layout
        };
        
        $scope.saveEvent(event, function(response) {
            if(response.status == 'eventSaved' || response.status == 'eventCreated') {
                $scope.firstLoad = 'loading';
                $scope.event.layout = layout;
                $log.debug('layout saved: '+layout);
            }
        });
            
    };
    
    
}]);