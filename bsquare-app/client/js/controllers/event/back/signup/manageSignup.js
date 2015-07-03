controllers.controller('event.back.signup.ManageSignupCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout', '$translate',
		 function($rootScope, $scope, $routeParams, $http, $log, $timeout, $translate) {
	
    
    $scope.fieldTypes = [
        {
            name: "email", title: $translate.instant('forms.dataType.email')
        },
        {
            name: "name", title: $translate.instant('forms.dataType.name')
        },
        {
            name: "phoneNumber", title: $translate.instant('forms.dataType.phoneNumber')
        },
        {
            name: "address", title: $translate.instant('forms.dataType.address')
        },
        {
            name: "anyText", title: $translate.instant('forms.dataType.customText')
        }
    ];
    
    $scope.init = function() {
        
        $scope.signupFields = $scope.event.signupFields;    
        
        if($scope.signupFields === undefined) {
            $scope.signupFields = [];
        }
        
    };
    
    
    $scope.newField = {
        name: "name",
        title: $translate.instant('forms.dataType.name'),
        type: $scope.fieldTypes[1],
        required: "false"
    };
    
    
    $scope.saveSignupFields = function() {
        
        var event = {
            _id: $scope.event._id,
            signupFields: $scope.signupFields
        };
        
        $scope.saveEvent(event, function(response) {
            if(response.status == 'eventSaved') {
                $scope.event.signupFields = event.signupFields;
                $log.debug('signupFields saved: ');
                $log.debug(event.signupFields);
            }
        });
            
    };
    
    
    $scope.addNewField = function() {
        
        var newField = $scope.newField;
        
        if($scope.newField.type.name != 'anyText') {
            newField.name = $scope.newField.type.name;
            newField.title = $scope.newField.type.title;
        }
        
        $scope.signupFields.push(newField);
        $scope.event.signupFields = $scope.signupFields;
        
        $scope.newField = {
            type: $scope.fieldTypes[1],
            required: "false"
        };
        
        $log.debug($scope.signupFields);
        $scope.saveSignupFields();
        
        
    };
    
    $scope.removeField = function(index) {
        
        $scope.signupFields.splice(index, 1);
        $scope.event.signupFields = $scope.signupFields;
        
        $log.debug($scope.signupFields);
        
    };
    
    $scope.updateNewField = function() {
        
        $scope.newField.name = $scope.newField.type.name;
        $scope.newField.title = $scope.newField.type.title;
        
    };
    
    $scope.init();
	
    
}]);
