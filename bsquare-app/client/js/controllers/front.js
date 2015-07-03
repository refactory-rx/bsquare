controllers.controller('FrontCtrl', 
		['$scope', '$routeParams', '$http', '$location', 
		 function($scope, $routeParams, $http, $location) {
    
	$scope.appName = $scope.$parent.name;
    
}]);