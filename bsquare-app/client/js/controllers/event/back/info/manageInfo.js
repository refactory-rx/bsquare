controllers.controller(
    "event.back.info.ManageInfoCtrl", 
    ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout', 'stringUtils', 'validationService',
    ($rootScope, $scope, $routeParams, $http, $log, $timeout, stringUtils, validationService) => {
	
    $scope.imageUploadStatus = "upload";
    $scope.infoStatus = "none";
    
    $scope.init = () => {
        
        if(!$scope.event) {
            return;
        }
         
        var info = angular.copy($scope.event.info);
        
        if(!info.eventImage || info.eventImage === "") {
            $scope.imageUploadStatus = "upload";
        } else {
            $scope.imageUploadStatus = "inactive";
        }
        
        if(info.timeStart) {
            $scope.eventStartTime = new Date(info.timeStart);
		}
		
        if(info.timeEnd) {
            $scope.eventEndTime = new Date(info.timeEnd);
		}
		
        if(info.place) {
            var input = document.getElementById("place-input");
            console.log($scope.event);
            input.value = info.place.address;
        }
        
        if ($scope.infoStatus === "none" || $scope.infoStatus === "init") {        
            $scope.infoStatus = "viewInit";
        }

        $scope.info = info;
        
    };
    
    $scope.$watch("info", (info) => {
        
        console.log("info changed", $scope.infoStatus, info);
        
        if ($scope.infoStatus === "none" || $scope.infoStatus === "viewInit") {
            $scope.infoStatus = "init";  
        } else {
            $scope.infoStatus = "changed";
        }
        
        console.log("infoStatus="+$scope.infoStatus);
        
    }, true);
    
    $scope.$watch("eventStatus", (eventStatus) => {
    	
    	if(eventStatus === "loaded") {
        	console.log("init manage info");
            $scope.init();
    	}
    		
    }, true);
        
    $scope.enableImageUpload = () => {
        $scope.imageUploadStatus = "upload";
    };
    
    $scope.finishImageUpload = () => {
        $scope.imageUploadStatus = "inactive";
    };
    
    $scope.selectPlace = (ac) => {
    	console.log("select place...");
    	var place = autocomplete[ac].getPlace();
    	$log.debug(place);
    };
    
    
    $scope.submit = () => {
        
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
        
        $scope.saveEvent(event, (response) => {
            if(response.status === "ok") {
                $scope.infoStatus = "saved";
                $scope.event.info = angular.copy($scope.info);
            }
        });
        
    };
    
    $scope.$watch("eventStartTime", (startTime) => {
        if(startTime) {
    		$scope.info.timeStart = startTime.getTime();
    	}
    }, true);
    
    $scope.$watch("eventEndTime", (endTime) => {
        if(endTime) {
    		$scope.info.timeEnd = endTime.getTime();
    	}
    }, true);
    
    $scope.uploadEventImage = () => {
        
        var uploadForm = document.getElementById("eventImageUpload");
        var formData = new FormData(uploadForm);
        console.log(formData);
        console.log(uploadForm);
        
        var url = `/api/uploads/${$scope.event._id}/file`;
        
        var xhr = new XMLHttpRequest();
        
        xhr.open("POST", url, true);
        xhr.setRequestHeader("session-token", requestHeaders["session-token"]); 
        xhr.setRequestHeader("bsquare-user", requestHeaders["bsquare-user"]); 
        xhr.send(formData);
        
        xhr.onreadystatechange = () => { 
            if(xhr.readyState == 4 && xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);
                $scope.$apply(() => {
                    console.log("img upload respons", response);
                    $scope.imageUploadStatus = "inactive";
                    $scope.info.eventImage = response.eventImage;
                    $("#eventImageThumbnail").attr("src", `img${response.eventImage}?changed=${(new Date()).getTime()}`);
                    $("#eventImage").attr("src", `img${response.eventImage}?changed=${(new Date()).getTime()}`);
                });
            }
        };
  
            
    };
    
    //$scope.init();
    
    setTimeout(() => {
    	
    	let input = document.getElementById("place-input");
    	
    	let options = {
            types: ["geocode", "locality", "postal_town"]
        };
        
    	let autocomplete = new google.maps.places.Autocomplete(input);
        
    	console.log(autocomplete);
    	
        google.maps.event.addListener(autocomplete, "place_changed", () => {

            let vicinity = null;
            let place = autocomplete.getPlace();
            let addr_components = place.address_components;

            for (let i = 0; i < addr_components.length; i++) {
                var types = addr_components[i].types;
                if (types.indexOf("locality") != -1 || types.indexOf("administrative_area_level_3") != -1) {
                    vicinity = addr_components[i].long_name;
                    break;
                }
            }

            console.log("full place", place);
             
            $scope.$apply(() => {
                
                $scope.info.place = {
                    
                    address: input.value,
                    vicinity: vicinity || place.vicinity,
                    
                    coords: {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    }
                };
                
                $scope.initMap();
                $scope.infoState = "changed";
                console.log($scope.info.place);
                
            });
            
        });
    	
    	
    }, 1000);
    
    
}]);
