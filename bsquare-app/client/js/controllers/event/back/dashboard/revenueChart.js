controllers.controller('event.back.dashboard.RevenueChartCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout', '$interval',
		 function($rootScope, $scope, $routeParams, $http, $log, $timeout, $interval) {
	
	
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
        
        $http.get('/api/stats/'+$scope.event._id+'/revenue', { headers: requestHeaders } )
		.success(function(response) {
		    
		    console.log(response);
		    
		    var data = $scope.parseChartData(response);
		    
		    $scope.chart = c3.generate({
                bindto: '#revenue-chart',
                data: data
            });
            
            $scope.interval = $interval(function() {
                $scope.loadCharts();    
            }, 5000);
		    
		});
            
    };
    
    
    $scope.loadCharts = function() {
        
        $http.get('/api/stats/'+$scope.event._id+'/revenue', { headers: requestHeaders } )
		.success(function(response) {
		    
		    console.log(response);
		    
		    var data = $scope.parseChartData(response);
		    
		    $scope.chart.load({
                columns: data.columns 
            });
		    
		});
		
        
    };
    
    
    $scope.parseChartData = function(response) {
        
	    var columns = [];
	    var types = {};
	    var groups = [[]];
	    
	    var responseRows = response.trim().split('\n');
	    var firstRow = responseRows[0];
	    var firstRowCells = firstRow.split('\t');
	    for(var i=1; i<firstRowCells.length; i++) {
	        var column = [firstRowCells[i]];
	        columns.push(column);
	        types[firstRowCells[i]] = 'area-spline';
	        groups[0].push(firstRowCells[i]);
	    }
	    
	    for(var i=1; i<responseRows.length; i++) {
	        var cells = responseRows[i].split('\t');
	        //console.log(responseRows[i]+': '+cells.length);
	        for(var j=1; j<cells.length; j++) {
	            //console.log(j+', '+cells[j]);
	            columns[j-1].push(cells[j]);
	        }
	    }
	    
	    console.log(columns);
	    
	    var data = {
            columns: columns,
            types: types,
            groups: groups
        };
        
        return data;
          
    };
    
    /*
    $scope.setupCharts = function() {
        
        d3.revenue = function() {
            
            var width = 640, 
                height = 480, 
                numTicks = 10, 
                duration = 1000;
            
            function revenue(g) {
                
                g.each(function(data, i) {
                    
                    g.selectAll(".revenue").remove();
                    g.selectAll(".tick").remove();
                    
                    var parseDate = function(millis) {
                        return new Date(millis);    
                    };
                    
                    var formatPercent = d3.format(".2r");
            
                    var x = d3.time.scale()
                        .range([0, width]);
            
                    var y = d3.scale.linear()
                        .range([height, 0]);
            
                    var prevColor = d3.scale.category20();
                    prevColor.domain(d3.keys($scope.prevData[0]).filter(function(key) { return key !== "date"; }));
                    
                    var color = d3.scale.category20();
                    color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));
                    
                    var area = d3.svg.area()
                        .x(function(d) { return x(d.date); })
                        .y0(function(d) { return y(d.y0); })
                        .y1(function(d) { return y(d.y0 + d.y); });
            
                    var stack = d3.layout.stack()
                        .values(function(d) { return d.values; });
                    
                    data.forEach(function(d) {
                        console.log(d.date);
                        d.date = parseDate(parseInt(d.date));
                        console.log(d.date);
                    });
                    
                    
                    var prevRevenues = stack(prevColor.domain().map(function(name) {
                        return {
                            name: name,
                            values: $scope.prevData.map(function(d) {
                                return { date: d.date, y: parseFloat(d[name]) };
                            })
                        };
                    
                    }));
                    
                    var revenues = stack(color.domain().map(function(name) {
                        return {
                            name: name,
                            values: data.map(function(d) {
                                return { date: d.date, y: parseFloat(d[name]) };
                            })
                        };
                    
                    }));
                    
                    var timeshift = true;
                    var lastTotal = 0;
                    
                    if(revenues.length > 0) {
                        
                        console.log(revenues);
                        if(prevRevenues[0]) {
                            timeshift = revenues[0].values.length != prevRevenues[0].values.length;
                        } else {
                            timeshift = true;
                        }
                        
                        var lastRow = data[data.length-1];
                        var propertyNames = Object.getOwnPropertyNames(lastRow);
                        for(var i=0; i<propertyNames.length; i++) {
                            if(propertyNames[i] != 'date') {
                                lastTotal += parseFloat(lastRow[propertyNames[i]]);
                            }
                        }
                        
                    }
                    
                    console.log('timeshift', timeshift);
                    
                    x.domain(d3.extent(data, function(d) { return d.date; }));
                    
                    y.domain([0, lastTotal]);
                    
                    var revenue = g.selectAll(".revenue")
                        .data(revenues)
                    
                    revenue.enter().append("g")
                            .attr("class", "revenue");
                    
                    var valIndex = 0;
                    var prevValIndex = 0;
                    
                    var revAttr = revenue.append("path")
                        .attr("class", "area")
                        .attr("d", function(d) {
                            if(!timeshift) {
                                var dArea = area(prevRevenues[prevValIndex].values);
                                prevValIndex++;
                                return dArea;
                            } else {
                                return area(d.values);
                            }
                        })
                        .style("fill", function(d) { return color(d.name); });
                        
                    if(prevRevenues.length == revenues.length) {
                        revAttr.transition()
                            .duration(1000)
                                .attr("d", function(d) {
                                    if(!timeshift) {
                                        var dArea = area(revenues[valIndex].values);
                                        valIndex++;
                                        return dArea;
                                    } else {
                                        return area(d.values);
                                    }
                                });
                        }
                
                    revenue.append("text")
                        .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
                        .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.y0 + d.value.y / 2) + ")"; })
                        .attr("x", -6)
                        .attr("dy", ".35em")
                        .text(function(d) { return d.name; });
                    
                    
                    var xAxis = d3.svg.axis()
                        .scale(x)
                        .orient("bottom")
                        .ticks(numTicks);
            
                    var yAxis = d3.svg.axis()
                        .scale(y)
                        .orient("left")
                        .tickFormat(formatPercent);
                        
                    g.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + height + ")")
                        .call(xAxis);
                
                    g.append("g")
                        .attr("class", "y axis")
                        .call(yAxis);
                        
                });
                
                d3.timer.flush();
                
            }
            
            
            revenue.width = function(x) {
                if(!arguments.length) return width;
                width = x;
                return revenue;
            };
            
            revenue.height = function(x) {
                if(!arguments.length) return height;
                height = x;
                return revenue;
            };
            
            revenue.numTicks = function(x) {
                if(!arguments.length) return numTicks;
                numTicks = x;
                return revenue;
            };
            
            revenue.duration = function(x) {
                if(!arguments.length) return duration;
                duration = x;
                return revenue;
            };
            
            return revenue;
                
        };
        
            
    };
    
    
    $scope.initCharts = function() {
        
        var screenWidth = $('.event').width();
        
        var margin, width, height, titleBox, numTicks;
        
        if(screenWidth > 640) {
            margin = { top: 5, right: 40, bottom: 20, left: 166 };
            width = screenWidth - margin.left - margin.right;
            height = 300 - margin.top - margin.bottom;
            titleBox = { titleX: -50, titleY: height/2, subtitleX: -50, subtitleY: height/2, titleAnchor: 'end', subtitleAnchor: 'end', subtitleDy: '1em' };
            numTicks = 20;
        } else {
            margin = { top: 20, right: 5, bottom: 20, left: 30 };
            width = screenWidth - margin.left - margin.right;
            height = 200 - margin.top - margin.bottom;
            titleBox = { titleX: -26, titleY: -10, subtitleX: width, subtitleY: -10, titleAnchor: 'start', subtitleAnchor: 'end', subtitleDy: 0 };
            numTicks = 6;
        }
        
        
        d3.tsv('/api/stats/'+$scope.event._id+'/revenue')
            .header('session-token', requestHeaders['session-token'])
            .get(function(error, data) {
            
            console.log(data);
            
            $scope.prevData = data;
            $scope.data = data;
            
            var chart = d3.revenue()
                .width(width)
                .height(height)
                .numTicks(numTicks);
            
            $scope.chart = chart;
            
            var svg = d3.select("#revenue-chart").selectAll("svg")
                .data([data])
            .enter().append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(chart);
            
            $scope.svg = svg;
            
            var title = svg.append("g")
                .style("text-anchor", titleBox.titleAnchor)
                .attr("transform", "translate("+titleBox.titleX+","+titleBox.titleY+")");
    
            title.append("text")
                .attr("class", "title")
                .text(function(d) { return "Revenue"; });
            
            var subtitle = svg.append("g")
                .style("text-anchor", titleBox.subtitleAnchor)
                .attr("transform", "translate("+titleBox.subtitleX+","+titleBox.subtitleY+")");
    
            subtitle.append("text")
                .attr("class", "subtitle")
                .style("text-anchor", titleBox.subtitleAnchor)
                .attr("dy", titleBox.subtitleDy)
                .text(function(d) { return "Revenue by ticket type"; });
                
        
        });
            
    };
    
    
    $scope.getStats = function() {
        
        d3.tsv('/api/stats/'+$scope.event._id+'/revenue')
            .header('session-token', requestHeaders['session-token'])
            .get(function(error, data) {
            
            $scope.prevData = $scope.data;
            $scope.svg.data([data]).call($scope.chart.duration(1000));
            
            $scope.data = data;
            
        });
        
    };
    */
    
    
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