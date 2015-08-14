console.log("load front ctrl");
controllers.controller('FrontCtrl', 
		['$scope', '$routeParams', '$http', '$location', 
		 function($scope, $routeParams, $http, $location) {
    
    $scope.val1 = 1; 
	$scope.appName = $scope.$parent.name;
    
}]);
