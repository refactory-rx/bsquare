controllers.controller('event.back.payout.PayoutCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout',
		 function($rootScope, $scope, $routeParams, $http, $log, $timeout) {
	
	$scope.payoutStatus = 'none';
	
    $scope.$watch('payout', function(payout) {
        
        console.log('payout', payout);
        
        $scope.setPayoutData(payout);
        
    }, true);
    
    
    $scope.setPayoutData = function(payout) {
        
        var payoutProperties = Object.getOwnPropertyNames(payout);
        
        if(payoutProperties.length > 0) {
            if($scope.payoutStatus === 'none') {
                $scope.payoutStatus = 'init';
            } else {
                $scope.payoutStatus = 'changed';
            }
        } else {
            $scope.payoutStatus = 'new';
        }
        
        console.log('payoutStatus = '+$scope.payoutStatus);
        
    };
    
    $scope.init = function() {
        
        console.log($scope.event.payout);
        
        if(!$scope.event.payout) {
            $scope.payout = {};
        } else {
            $scope.payout = angular.copy($scope.event.payout);
        }
        
    };
    
    
    $scope.savePayoutOptions = function() {
        
        var event = {
            _id: $scope.event._id,
            payout: $scope.payout
        };
        
        $scope.saveEvent(event, function(response) {
            if(response.status == 'eventSaved') {
                $scope.payoutStatus = 'saved';
                $scope.event.payout = angular.copy($scope.payout);
            } else if(response.status == 'eventCreated') {
                $scope.payoutStatus = 'created';
                $scope.event.payout = angular.copy($scope.payout);
            }
        });
            
    };
    
    $scope.init();
    
}]);