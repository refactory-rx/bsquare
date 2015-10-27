var INTEGER_REGEXP = /^\-?\d*$/;
mainApp.directive('integer', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue) {
        if (INTEGER_REGEXP.test(viewValue)) {
          // it is valid
          ctrl.$setValidity('integer', true);
          return viewValue;
        } else {
          // it is invalid, return undefined (no model update)
          ctrl.$setValidity('integer', false);
          return undefined;
        }
      });
    }
  };
});
 
var FLOAT_REGEXP = /^\-?\d+((\.|\,)\d+)?$/;
mainApp.directive('smartFloat', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue) {
        if (FLOAT_REGEXP.test(viewValue)) {
          var val = parseFloat(viewValue.replace(',', '.'));
          if(val >= 0) {
        	  ctrl.$setValidity('float', true);
        	  return val;
          } else {
        	  ctrl.$setValidity('float', false);
              return undefined;
          }
        } else {
          ctrl.$setValidity('float', false);
          return undefined;
        }
      });
    }
  };
});


var EMAIL_REGEXP = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
mainApp.directive('email', function() {
	  return {
	    require: 'ngModel',
	    link: function(scope, elm, attrs, ctrl) {
	      ctrl.$parsers.unshift(function(viewValue) {
	        if (EMAIL_REGEXP.test(viewValue) || viewValue === undefined || viewValue.length === 0) {
	          ctrl.$setValidity('email', true);
	          if(viewValue === undefined) {
	        	  return "";
	          } else {
	        	  return viewValue;
	          }
	        } else {
	          ctrl.$setValidity('email', false);
	          return '*';
	        }
	      });
	    }
	  };
	});
	
mainApp.directive('showonhoverparent',
   function() {
      return {
         link : function(scope, element, attrs) {
            element.parent().bind('mouseenter', function() {
                element.show();
            });
            element.parent().bind('mouseleave', function() {
                 element.hide();
            });
       }
   };
});


mainApp.directive("dateSelector", () => {

    let template = 
        `<div>
            <div>
                <span class="timeInputLabel">
                    {{label}}
                </span>
                <select class="form-control yearInput" ng-model="dateInput.year">
                    <option value="2015">2015</option>
                    <option value="2016">2016</option>
                </select>
                <select class="form-control monthInput" ng-model="dateInput.month">
                    <option value="1">01 Jan</option>
                    <option value="2">02 Feb</option>
                    <option value="3">03 Mar</option>
                    <option value="4">04 Apr</option>
                    <option value="5">05 May</option>
                    <option value="6">06 Jun</option>
                    <option value="7">07 Jul</option>
                    <option value="8">08 Aug</option>
                    <option value="9">09 Sep</option>
                    <option value="10">10 Oct</option>
                    <option value="11">11 Nov</option>
                    <option value="12">12 Dec</option>
                </select>
                <select class="form-control dateInput" ng-model="dateInput.date">
                    <option ng-selected="dateInput.date === d" ng-repeat="d in monthDates(dateInput.month)" value="{{d}}">{{d}}</option>
                </select>
                <select class="form-control hourInput" ng-model="dateInput.hour">
                    <option ng-selected="dateInput.hour === h" ng-repeat="h in dayHours()" value="{{h}}">{{h}}</option>
                </select>
                <select class="form-control minuteInput" ng-model="dateInput.minute">
                    <option value="0">{{dateInput.hour}}:00</option>
                    <option value="15">{{dateInput.hour}}:15</option>
                    <option value="30">{{dateInput.hour}}:30</option>
                    <option value="45">{{dateInput.hour}}:45</option>
                </select>
            </div>
         </div>`;

     return {
        restrict: "E",
        transclude: true,
        scope: {
            dateOutput: "=",
            label: "="
        },
        template: template,
        controller: [ "$scope", ($scope) => {
             
            $scope.dateInput = { edited: false };

            $scope.$watch("dateInput", (dateInput) => {
                
                console.log("dateInput changed", dateInput);
                if (!dateInput) {
                    return;
                }
                
                if (
                    dateInput.year !== undefined &&
                    dateInput.month !== undefined &&
                    dateInput.date !== undefined &&
                    dateInput.hour !== undefined &&
                    dateInput.minute !== undefined) {
                    
                    let date = new Date(
                        dateInput.year, 
                        dateInput.month - 1, 
                        dateInput.date, 
                        dateInput.hour, 
                        dateInput.minute, 0, 0); 
                    console.log("setting date output", date);
                    $scope.dateOutput = date;

                }
            
            }, true);
            
            $scope.$watch("dateOutput", (dateOutput) => {
                
                console.log("dateOutput changed", dateOutput);
                if (!dateOutput) {
                    return;
                }
                
                $scope.setDateInput(dateOutput);
                console.log("set date input to", $scope.dateInput);

            }, true);
            
            $scope.setDateInput = (date) => {

                $scope.dateInput.year = date.getFullYear(); 
                $scope.dateInput.month = date.getMonth() + 1; 
                $scope.dateInput.date = date.getDate(); 
                $scope.dateInput.day = date.getDay(); 

                if (date.getMinutes() % 15 !== 0) {
                    $scope.dateInput.hour = date.getHours() + 1;
                    $scope.dateInput.minute = 0; 
                } else {
                    $scope.dateInput.hour = date.getHours();
                    $scope.dateInput.minute = date.getMinutes(); 
                }

            };

            $scope.monthDates = (month) => {

                month = parseInt(month);

                let months31 = [1, 3, 5, 7, 8, 10, 12];
                let months30 = [4, 6, 9, 11];

                let maxDate = 29; 
                if (months31.indexOf(month) !== -1) {
                    maxDate = 31;
                } else if (months30.indexOf(month) !== -1) {
                    maxDate = 30;
                }

                var dates = [];
                for (let i = 1; i <= maxDate; i++) {
                    dates.push(i);
                }
                return dates;
            };

            $scope.dayHours = () => {
                let hours = [];
                for (let i = 0; i < 24; i++) {
                    hours.push(i);
                }
                return hours;
            };
            

        }]
    };
});
