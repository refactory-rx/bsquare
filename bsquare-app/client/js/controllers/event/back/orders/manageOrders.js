controllers.controller('event.back.orders.ManageOrdersCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout',
		 function($rootScope, $scope, $routeParams, $http, $log, $timeout) {
	
    $scope.LIST_ORDERS_URL = 'parts/event/back/orders/listOrders.html';
    $scope.VIEW_ORDER_URL = 'parts/event/back/orders/viewOrder.html';
    
    $scope.viewUrl = $scope.LIST_ORDERS_URL;
    $scope.orders = [];
    
    $scope.searchField = {
        text: ''
    };
    
    $scope.refundAllStatus = { code: 'init' };
    
    $scope.init = function() {
        
        var params = { event: $scope.event._id };
        
        $http.get('/api/orders', { headers: requestHeaders, params: params })
            .success(function(response) {
                console.log(response);
                if(response.success == 1) {
                    $scope.orders = response.data;
                }
            })
            .error(function(response) {
               console.log(response); 
            });
            
    };
    
    $scope.saveOrder = function(order) {
        
        //$scope.saveOrder(order);
        $scope.viewUrl = $scope.LIST_ORDERS_URL;
        
    };
    
    $scope.viewOrder = function(order) {
        
        $scope.order = order;
        $scope.viewUrl = $scope.VIEW_ORDER_URL;
        
    };
    
    $scope.viewList = function() {
        $scope.viewUrl = $scope.LIST_ORDERS_URL;
    };
    
    $scope.searchOrder = function() {
        
        if($scope.searchTimeout) {
            $timeout.cancel($scope.searchTimeout);
        }
        
        $scope.searchTimeout = $timeout(function() {
            $scope.search($scope.searchField.text);
        }, 500);
            
    };
    
    $scope.search = function(searchText) {
        
        console.log('searchText='+searchText+'/');
        
        if(searchText && searchText.length > 0) {
            
            console.log(searchText);
            
            var params = { event: $scope.event._id, text: searchText };
            console.log(params);
            
            $http.get('/api/orders', { headers: requestHeaders, params: params })
            .success(function(response) {
                
                console.log(response);
                
                if(response.success == 1) {
                    $scope.orders = response.data;
                }
                
            })
            .error(function(response) {
               console.log(response); 
            });
            
        } else {
            $scope.init();
        }
        
    };
    
    
    $scope.refundAllFulfilled = function(orders) {
	    
	    var modifications = [];
	    
	    for(var i=0; i<orders.length; i++) {
	        if(orders[i].status === 'fulfilled' && orders[i].invoiceId) {
	            modifications.push({
	                type: 'refund',
	                invoiceId: orders[i].invoiceId
	            })
	        }    
	    }
	    
	    if(modifications.length === 0) {
	       $scope.refundAllStatus.code = 'nonerefundable';
	       console.log('none refundable!');
	       return;
	    } else {
	        $scope.refundAllStatus.ordersNum = modifications.length;
	        $scope.refundAllStatus.ordersTotal = $scope.orders.length;
            $scope.refundAllStatus.code = 'refunding';
	    }
	    
	    $http.put('/api/invoices', modifications, { headers: requestHeaders })
        .success(function(response) {
            
            console.log(response);
            if(response.status === 'invoicesModified') {
                $scope.refundAllStatus.code = 'refunded';
            } else {
                $scope.refundAllStatus.code = 'refundedWithErrors';
            }
            
            $scope.refundAllStatus.successOrdersNum = response.refundedNum;
            
            $scope.init();
                
        })
        .error(function(response) {
           console.log(response);
           $scope.refundAllStatus.code = 'error';
        });
	      
	};
	
	
    $scope.init();
    
    
}]);


controllers.controller('event.back.orders.ViewOrderCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$timeout',
		 function($rootScope, $scope, $routeParams, $http, $log, $timeout) {
	
	$scope.refundOrder = function(order) {
	    
	    var modification = {
	        type: 'refund',
	        invoiceId: order.invoiceId
	    };
	    
	    $http.put('/api/invoices', [ modification ], { headers: requestHeaders })
        .success(function(response) {
            
            console.log(response);
            if(response.status === 'invoicesModified') {
                order.status = 'refunded';
            }
            
        })
        .error(function(response) {
           console.log(response); 
        });
	      
	};
	
    
}]);
