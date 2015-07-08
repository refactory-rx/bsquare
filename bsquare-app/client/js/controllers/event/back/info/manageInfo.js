controllers.controller('event.back.info.ManageInfoCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout', 'stringUtils', 'validationService',
		 function($rootScope, $scope, $routeParams, $http, $log, $timeout, stringUtils, validationService) {
	
    $scope.imageUploadStatus = 'upload';
    $scope.infoStatus = 'none';
    
    $scope.init = function() {
        
        if(!$scope.event) {
            return;
        }
        
        var info = angular.copy($scope.event.info);
        
        if(!info.eventImage || info.eventImage === '') {
            $scope.imageUploadStatus = 'upload';
        } else {
            $scope.imageUploadStatus = 'inactive';
        }
        
        if(info.timeStart) {
            $scope.eventStartTime = new Date(info.timeStart);
		}
		
        if(info.timeEnd) {
            $scope.eventEndTime = new Date(info.timeEnd);
		}
		
        if(info.place) {
            var input = document.getElementById('place-input');
            console.log($scope.event);
            input.value = info.place.address;
        }
        
        $scope.info = info;
        
    };
    
    $scope.$watch('info', function(info) {
        
        console.log('info changed', info);
        
        if($scope.infoStatus === 'none') {
            $scope.infoStatus = 'init';  
        } else {
            $scope.infoStatus = 'changed';
        }
        
        console.log('infoStatus='+$scope.infoStatus);
        
    }, true);
    
    $scope.$watch('eventStatus', function(eventStatus) {
    	
    	if(eventStatus == 'loaded') {
        	
        	console.log('init manage info');
            
            $scope.init();
            
    	}
    		
    }, true);
        
    $scope.enableImageUpload = function() {
        $scope.imageUploadStatus = 'upload';
    };
    
    $scope.finishImageUpload = function() {
        $scope.imageUploadStatus = 'inactive';
    };
    
    $scope.selectPlace = function(ac) {
    	
    	console.log('select place...');
    	var place = autocomplete[ac].getPlace();
    	$log.debug(place);
    
    };
    
    
    $scope.submit = function() {
        
        if($scope.validationErrors) {
    		delete $scope.validationErrors;
    	}
    	
    	var validationErrors = validationService.validateEventFields($scope.info);
    	if(validationErrors.keys.length > 0) {
    		$scope.validationErrors = validationErrors;
    		return;
    	}
    	
    	var event = {
    	    _id: $scope.event._id,
    	    info: $scope.info
    	};
        
        $scope.saveEvent(event, function(response) {
            if(response.status == 'eventSaved') {
                $scope.infoStatus = 'saved';
                $scope.event.info = angular.copy($scope.info);
            }
        });
        
    };
    
    $scope.$watch('eventStartTime', function(startTime) {
        if(startTime) {
    		$scope.info.timeStart = startTime.getTime();
    	}
    }, true);
    
    $scope.$watch('eventEndTime', function(endTime) {
        if(endTime) {
    		$scope.info.timeEnd = endTime.getTime();
    	}
    }, true);
    
    $scope.uploadEventImage = function() {
        
        var uploadForm = document.getElementById('eventImageUpload');
        var formData = new FormData(uploadForm);
        console.log(formData);
        console.log(uploadForm);
        
        var url = '/api/uploads/'+$scope.event._id+'/file';
        
        var xhr = new XMLHttpRequest();
        
        xhr.open('POST', url, true);
        xhr.send(formData);
        
        xhr.onreadystatechange = function() { 
            if(xhr.readyState == 4 && xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);
                $scope.$apply(() => {
                    $scope.imageUploadStatus = 'inactive';
                    $scope.info.eventImage = response.eventImage;
                    $('#eventImageThumbnail').attr('src', response.eventImage+'?changed='+(new Date()).getTime());
                    $('#eventImage').attr('src', response.eventImage+'?changed='+(new Date()).getTime());
                });
            }
        };
  
            
    };
    
    $scope.init();
    
    setTimeout(function() {
    	
    	var input = document.getElementById('place-input');
    	
    	var options = {
            types: ['geocode']
        };
        
    	var autocomplete = new google.maps.places.Autocomplete(input);
        
    	console.log(autocomplete);
    	
        google.maps.event.addListener(autocomplete, 'place_changed', function() {
            
            var place = autocomplete.getPlace();
            //console.log(place);
            
            $scope.$apply(function() {
                
                $scope.info.place = {
                    
                    address: input.value,
                    vicinity: place.vicinity,
                    
                    coords: {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    }
                };
                
                $scope.initMap();
                console.log($scope.info.place);
                
            });
            
        });
    	
    	
    }, 1000);
    
    
}]);
