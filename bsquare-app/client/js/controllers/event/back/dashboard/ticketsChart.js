controllers.controller('event.back.dashboard.TicketsChartCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout', '$interval', '$translate',
		 function($rootScope, $scope, $routeParams, $http, $log, $timeout, $interval, $translate) {
	
    
    $scope.init = function() {
        
        /*
        var interval = $interval(function() {
            $scope.getStats();    
        }, 5000);
    
        $scope.$on('$destroy', function() {
            console.log('destroying interval');
            $interval.cancel(interval);
        });
        
        $scope.setupCharts();
        $scope.initCharts();
        */
        
        $scope.generateChart();
        
    };
    
    $scope.generateChart = function() {
        
        $http.get('/api/stats/'+$scope.event._id+'/tickets', { headers: requestHeaders } )
		.success(function(response) {
		    
		    console.log(response);
		    
		    var data = $scope.parseChartData(response);
		    
		    console.log(data);
		    
		    var countsByResource = response.data.countsByResource;
            var resourceIds = Object.getOwnPropertyNames(countsByResource);
            var categories = [];
            for(var i = 0; i < resourceIds.length; i++) {
                var resource = countsByResource[resourceIds[i]];
                categories.push(resource.name);
            }
            
		    var chart = c3.generate({
		        bindto: '#tickets-chart',
		        data: data,
		        axis: {
                    x: {
                        type: 'category',
                        categories: categories
                    }
                }
		    });
		    
		    $scope.chart = chart;
		    
            $scope.interval = $interval(function() {
                $scope.loadCharts();    
            }, 5000);
		    
		});
            
    };
    
    
    $scope.loadCharts = function() {
        
        $http.get('/api/stats/'+$scope.event._id+'/tickets', { headers: requestHeaders } )
		.success(function(response) {
		    
		    console.log(response);
		    
		    var data = $scope.parseChartData(response);
		    
		    $scope.chart.load({
                columns: data.columns 
            });
		    
		});
		
        
    };
    
    
    $scope.parseChartData = function(response) {
        
        var columns = [
            [ $translate.instant('event.back.dashboard.attended') ], 
            [ $translate.instant('event.back.dashboard.sold') ], 
            [ $translate.instant('event.back.dashboard.remaining') ]
        ];
         
        var countsByResource = response.data.countsByResource;
        var resourceIds = Object.keys(countsByResource);
        
        for(var i=0; i < resourceIds.length; i++) {
            var resource = countsByResource[resourceIds[i]];
            columns[0].push(resource.attended);
            columns[1].push(resource.sold);
            columns[2].push(resource.quantity-resource.sold);
        }
        
        var data = {
            //x: 'x',
            columns: columns,
            type : 'bar',
            groups: [
                [ 'Attended', 'Sold', 'Remaining' ]
            ]
        };
        
        
        return data;
        
          
    };
    
    
    if($scope.event) {
	    $scope.init();
	} else {
	    $scope.$watch('eventStatus', function(eventStatus) {
    	    if(eventStatus === 'loaded') {
    	        $scope.init();
    	    }    
    	}, true);    
	}
    
    
	$scope.$on('$destroy', function() {
	   $interval.cancel($scope.interval); 
	});
    
    
}]);
