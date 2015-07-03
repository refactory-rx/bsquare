controllers.controller('event.back.dashboard.DashboardCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout',
		 function($rootScope, $scope, $routeParams, $http, $log, $timeout) {
	
	console.log('DASHBOARDS!!!');
	
    $scope.stats = {};
    
    $scope.init = function() {
        
        console.log('dashbrdctrl->init');
        //$scope.getStats();
        
    };
    
    
    
    
    $scope.init();
    
    
    
}]);