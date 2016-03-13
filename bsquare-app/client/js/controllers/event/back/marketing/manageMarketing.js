controllers.controller('event.back.marketing.ManageMarketingCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout', '$translate',
		 function($rootScope, $scope, $routeParams, $http, $log, $timeout, $translate) {
	
    
    $scope.rewardTemplateUrl = 'parts/event/back/marketing/rewardList.html';
    
    $scope.refConditionTypes = [
        { type: 'sale', title: $translate.instant('event.back.marketing.sale') },
        { type: 'attendance', title: $translate.instant('event.back.marketing.attendance') },
        { type: 'impression', title: $translate.instant('event.back.marketing.impression') }
    ];
    
    $scope.newGroupCondition = {};
    $scope.newRefCondition = {
        type: $scope.refConditionTypes[2]
    };
    $scope.newRefReward = {};
    $scope.newPointReward = {};
    
    $scope.init = function() {
        
        $scope.getTicketResources();
        
        if($scope.event.groupRewards === undefined) {
            $scope.event.groupRewards = {
                conditions: []
            };
        }
        
        if($scope.event.refRewards === undefined) {
            $scope.event.refRewards = {
                conditions: [],
                pointRewards: []
            };
        }
        
    };
    
    
    $scope.saveRewards = function(layout) {
        
        var event = {
            _id: $scope.event._id,
            groupRewards: $scope.event.groupRewards,
            refRewards: $scope.event.refRewards
        };
        
        $scope.saveEvent(event, function(response) {
            if(response.status == 'eventSaved' || response.status == 'eventCreated') {
                $log.debug('rewards saved');
            }
        });
            
    };
    
    
    $scope.createGroupCondition = function() {
        
        $scope.newGroupCondition = {
            type: { type: 'sale', title: $translate.instant('event.back.marketing.sale') },
            ticketResource: $scope.ticketResources[0],
            reward: {
                type: 'custom',
                ticketResource: $scope.ticketResources[0]
            }
        };
        
        $scope.rewardTemplateUrl = 'parts/event/back/marketing/newGroupCondition.html';
        
    };
    
    $scope.createRefReward = function() {
        
        $scope.newRefReward = {
            type: 'custom',
            ticketResource: $scope.ticketResources[0]
        };
        
        $scope.rewardTemplateUrl = 'parts/event/back/marketing/newRefReward.html';
        
    };
    
    $scope.savePointReward = function() {
        
        $scope.event.refRewards.pointRewards.push($scope.newPointReward);
        $scope.saveEvent($scope.event);
        
        $scope.newPointReward = {
            type: 'custom',
            ticketResource: $scope.ticketResources[0]
        };
        
        $scope.rewardTemplateUrl = 'parts/event/back/marketing/rewardList.html';
        
    };
    
    $scope.removeReward = function(index) {
        
    };
    
    $scope.cancelNewReward = function(index) {
        $scope.newReward = {};
        $scope.rewardTemplateUrl = 'parts/event/back/marketing/rewardList.html';
    };
    
    $scope.saveGroupCondition = function(condition) {
        
        $scope.event.groupRewards.conditions.push(condition);
        $scope.saveEvent($scope.event);
        
        $scope.newGroupCondition = {
            type: { type: 'sale', title: $translate.instant('event.back.marketing.sale') },
            ticketResource: $scope.ticketResources[0],
            reward: {
                type: 'custom',
                ticketResource: $scope.ticketResources[0]
            }
        };
        
        $scope.rewardTemplateUrl = 'parts/event/back/marketing/rewardList.html';
    
    };
   
    $scope.deleteGroupCondition = function(index) {
        $scope.event.groupRewards.conditions.splice(index, 1);
        $scope.saveEvent($scope.event);
    };
    
    $scope.saveRefCondition = function(condition) {
        
      $scope.event.refRewards.conditions.push(condition);
      $scope.saveEvent($scope.event);
      
      $scope.newRefCondition = {
          type: $scope.refConditionTypes[2],
          ticketResource: $scope.ticketResources[0]
      };
      
      $scope.rewardTemplateUrl = 'parts/event/back/marketing/rewardList.html';
    
    };
    
    $scope.deleteRefCondition = function(index) {
        $scope.event.refRewards.conditions.splice(index, 1);
        $scope.saveEvent($scope.event);
    };
     
    $scope.init();
    
    
}]);
