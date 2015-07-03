controllers.controller('OrderEntryCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$sce', '$interval', '$translate',
		 function($rootScope, $scope, $routeParams, $http, $log, $sce, $interval, $translate) {
	
	$rootScope.setRootView('order');
	
	$scope.orderId = $routeParams.id;
	$scope.event = {};
	
	$scope.$watch('savedOrder', function(value) {
    	
    	if(value !== undefined) {
    		
    		if($scope.order !== undefined) {
    			$log.debug('order changed');
    			$scope.orderChanged = true;
    			$scope.orderStatus = 'changed';
    		}
    		
    		$scope.order = angular.copy(value);
    		
    		$scope.getEvent($scope.order.event);
			$scope.getInvoice($scope.order);
			
			if($scope.order.status != 'fulfilled' && $scope.order.status != 'timedout' && $scope.order.status != 'refunded') {
				
				var now = (new Date()).getTime();
				$scope.remainingTime = 15*60*1000 - (now - $scope.order.timePlaced);
				
				console.log('remainingTime', $scope.remainingTime);
				$scope.timeCountingInterval = $interval(function() {
					$scope.remainingTime -= 1000;
					if($scope.remainingTime <= 0) {
						$scope.order.status = 'timedout';
						$interval.cancel($scope.timeCountingInterval);
					}
				}, 1000);
				
			}
			
    	}
    	
		
	}, true);
	
	
	$scope.$on('destroy', function() {
		if($scope.timeCountingInterval) {
			$interval.cancel($scope.timeCountingInterval);
		}
	});
    
    
    $scope.$watch('orderId', function(value) {
        
        var orderId = $scope.orderId;
        
        if(orderId !== undefined) {
            
            $log.debug('orderId set: '+orderId);
            $scope.getOrder(orderId);
            
        }
        
    }, true);
    
    
	$scope.getOrder = function(id) {
		
		$scope.showOrderError = false;
		
		$log.debug('getting order...');
		
		$http.get('/api/orders/'+id, { headers: requestHeaders } )
		
			.success(function(response) {
				
			    $log.debug(response);
				
				if(response.status == 'orderFound' || response.status == 'orderCreated') {
					
					$scope.savedOrder = response.order;
					
				} else {
				    $scope.showOrderError = true;
					$scope.orderStatus = 'error';
					$scope.orderErrorMessage = response.message;
				}
				
			})
			
			.error(function(data) {
			    
				$log.debug('Error: ' + data);
			    $scope.showOrderError = true;
				$scope.orderStatus = 'error';
				$scope.orderErrorMessage = 'Network error while getting order.';
				
			});
			
			
	};
	
	
	$scope.getEvent = function(id) {
		
		$log.debug('getting event '+id);
		
		$http.get('/api/events/'+id, { headers: requestHeaders } )
			.success(function(response) {
				
				$log.debug(response);
				
				if(response.status == 'eventFound') {
					
    				$scope.event = response.event;
    				
				} else {
					$scope.orderStatus = 'error';
					$scope.orderErrorMessage = response.message;
				}
				
			})
			.error(function(data) {
				$log.debug('Error: ' + data);
			});
			
	};
	
	
	$scope.getInvoice = function(order) {
		
		if(order.invoiceId !== undefined) {
		    
		    $log.debug('getting invoice');
		    
    		$http.get('/api/invoices/'+order.invoiceId, { headers: requestHeaders } )
    			.success(function(response) {
    				
    				$log.debug(response);
    				
    				if(response.status == 'invoiceFound') {
    					
    					var invoice = response.invoice;
    					if(invoice.status === 'expired' || invoice.status === 'failed') {
    						$scope.getCheckoutInvoice(order);	
    					} else {
        					$scope.invoice = response.invoice;
    					}
		    
    				} else if(response.status == 'invoicePaid') {
    				    
    				    $scope.invoice = response.invoice;
    				    $scope.order.tickets = response.tickets;
    				    $scope.order.status = 'fulfilled';
    				    
    				}
    				
    			})
    			.error(function(data) {
    				$log.debug('Error: ' + data);
    			});
    			
		} else {
		    
		    $log.debug('no invoice id');
		    
		    $scope.getCheckoutInvoice(order);
    			
		    
		}
			
	};
	
	$scope.getCheckoutInvoice = function(order) {
		
		$http.get('/api/invoices/checkout/'+order._id, { headers: requestHeaders } )
		.success(function(response) {
			
			console.log('invoice response', response);
				
			if(response.status == 'invoiceProvided') {
				var banks = response.invoice.extData.trade.payments[0].payment[0].banks[0];
				console.log(banks);
				
				var bankNames = Object.getOwnPropertyNames(banks);
				for(var i=0; i < bankNames.length; i++) {
					var bank = banks[bankNames[i]][0];
					var fmtBank = {};
					fmtBank.action = bank.$.url;
					fmtBank.icon = bank.$.icon;
					var inputNames = Object.getOwnPropertyNames(bank);
					var inputs = [];
					for(var j=0; j < inputNames.length; j++) {
						if(inputNames[j] !== '$') {
							inputs.push({
								name: inputNames[j],
								value: bank[inputNames[j]][0]
							});
						}
					}
					fmtBank.inputs = inputs;
					banks[bankNames[i]] = fmtBank;
				}
				
				console.log(banks);
				$scope.banks = banks;
				$scope.checkoutInvoice = response.invoice;
				
			}
				
		})
		.error(function(data) {
			$log.debug('Error: ' + data);
		});
    		
	};
    		
	
	$scope.getTrustedUrl = function(url) {
		//console.log('get trusted url: '+url);
		var trusted = $sce.trustAsResourceUrl(url);
		//console.log(trusted);
		var trustedUrl = $sce.getTrustedUrl(trusted);
		//console.log(trustedUrl);
		return trusted;
	}
	
	
}]);

controllers.controller('OrderFrontCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log', '$filter', '$translate',
		 function($rootScope, $scope, $routeParams, $http, $log, $filter, $translate) {
	
	
	$rootScope.setRootView('orderFront');
	
    $scope.orderChanged = false;
    $scope.showOrderError = false;
    $scope.orderErrorMessage = '';
    $scope.orderStatus = '';

    $scope.confirmEmail = false;
     
    $scope.confirmEmailField = {
        name: 'confirmEmail',
        title: $translate.instant('forms.dataType.confirmEmail'),
        required: 'true',
        type: {
            name: 'confirmEmail',
            title: $translate.instant('forms.dataType.confirmEmail')
        }
    };

    $scope.$watch('event', function(event) {
    	
    	if(event) {

    		if($scope.event.signupFields) {
                
                var signupFields = angular.copy($scope.event.signupFields);
                  
                if($rootScope.logregStatus !== 'loggedIn' || 
                   $rootScope.loggedUser.emailVerified != 'true') {
                    
                    $scope.confirmEmail = true;    
                    
                    signupFields.splice(1, 0, $scope.confirmEmailField);
                    console.log("signup flds", signupFields);

                }

                if($rootScope.logregStatus === 'loggedIn') {
    				signupFields[0].value = $rootScope.loggedUser.email;
                }

                $scope.order.signupFields = signupFields;

    		}
    		
    		
    		$scope.validateForm();
    		
    	}
    		
    });
    
    
    $scope.formatRemainingTime = function(ms) {
    	var minutes = Math.floor(ms/(60*1000));
    	var seconds = Math.floor((ms-(minutes*60*1000))/1000);
    	return minutes+' min '+seconds+' s';
    };
    
    $scope.formatTime = function(time) {
		
		var date = new Date(parseInt(time));
    	return $filter('date')(date, 'MMM dd, y @ HH:mm');
			
	};
	
	$scope.payBtc = function() {
	    
	    var createInvoiceRequest = {
	        type: 'coinbase',
	        provider: 'coinbase',
	        orderId: $scope.order._id
	    };
	    
	    console.log('payBtc');
	    
	    $http.post('/api/invoices', createInvoiceRequest, { headers: requestHeaders } )
		.success(function(response) {
			
			console.log('invoice response', response);
			
			if(response.status == 'invoiceCreated') {
				
				$scope.showError = false;
				
				var invoice = response.invoice;
				
				window.location.href = invoice.url;
				
				//$scope.orderStatus = 'invoiced';
				//$scope.order.invoice = response.invoice;
				//$scope.saveOrder( { invoiceId: invoice._id } );
				
			} else {
				$scope.showOrderError = true;
				$scope.orderStatus = 'error';
				$scope.orderErrorMessage = response.message;
			}
			
			
		})
		.error(function(data) {
			console.log('Error: ' + data);
			$scope.showOrderError = true;
			$scope.orderStatus = 'error';
			$scope.orderErrorMessage = 'Network error while creating invoice.';
		});
		
	    
	};
	
	
	$scope.payCheckout = function(method) {
	    
	    var createInvoiceRequest = {
	        type: 'checkout',
	        provider: 'checkout',
	        invoice: $scope.checkoutInvoice,
	        orderId: $scope.order._id
	    };
	    
	    console.log('payCheckout');
	    
	    $http.post('/api/invoices', createInvoiceRequest, { headers: requestHeaders } )
		.success(function(response) {
			
			console.log('invoice response', response);
			
			if(response.status == 'invoiceCreated') {
				
				$scope.showError = false;
				var invoice = response.invoice;
				var form = $("#payment-"+method);
				console.log('form:', form);
				form.submit();
				
			} else {
				$scope.showOrderError = true;
				$scope.orderStatus = 'error';
				$scope.orderErrorMessage = response.message;
			}
			
			
		})
		.error(function(data) {
			console.log('Error: ' + data);
			$scope.showOrderError = true;
			$scope.orderStatus = 'error';
			$scope.orderErrorMessage = 'Network error while creating invoice.';
		});
		
	    
	};
	
	
	$scope.saveOrder = function(order, callback) {
		
		$scope.showOrderError = false;
		
		var orderRequest = {
			orderId: $scope.order._id,
			order: order,
			action: 'update'
		};
		
		$http.post('/api/orders', orderRequest, { headers: requestHeaders } )
			
			.success(function(response) {
				
				$log.debug(response);
				
				if(response.status == 'orderSaved') {
					$scope.showError = false;
					$scope.orderStatus = 'saved';
				} else {
					$scope.showOrderError = true;
					$scope.orderStatus = 'error';
					$scope.orderErrorMessage = response.message;
				}
				
				if(callback) {
					callback(response);
				}
				
			})
			
			.error(function(data) {
				
				$log.debug('Error: ' + data);
				$scope.showOrderError = true;
				$scope.orderStatus = 'error';
				$scope.orderErrorMessage = 'Network error while saving order.';
			
				if(callback) {
					callback(data);
				}
				
			});
			
		
	};
	
	
	$scope.validateForm = function() {
    	
    	console.log('validating...');
    	console.log($scope.order);
    	
    	if(!$scope.order || $scope.order.signupStatus == 'complete') {
    		return;
    	}
    	
    	console.log('validating');
    	
    	var fields = $scope.order.signupFields;
    	
    	if(fields && fields.length > 0) {
			
	    	for(var i=0; i < fields.length; i++) {
	    		if(fields[i].required == 'true') {
	    			if(fields[i].value === undefined || fields[i].value == '*') {
	    				$scope.order.signupStatus = 'formNotFilled';
	    				return;
	    			}
	    		}
		    }
		    
		    $scope.order.signupStatus = 'formFilled';
            
            if($rootScope.logregStatus != 'loggedIn' || $rootScope.loggedUser.emailVerified != 'true') {
                $scope.confirmEmail = true;
            } else {
                if($rootScope.loggedUser.email != fields[0].value) {
                    if(!$scope.confirmEmail) {
                        fields.splice(1, 0, $scope.confirmEmailField);
                        $scope.confirmEmail = true;
                    }
                } else {
                    if($scope.confirmEmail) {
                        fields.splice(1, 1);
                        $scope.confirmEmail = false;
                    }
                }

            }

            if($scope.confirmEmail) {
                var emailField = fields[0];
                var confirmEmailField = fields[1];
                
                if(emailField.value != confirmEmailField.value) {
                    $scope.order.signupStatus = 'formNotFilled';
                    return;
                }

            }
                
    	} else {
    		
    		$scope.order.signupStatus = 'complete';
    	
    		
    	}
    	
    };
	
	$scope.submitSignupFields = function() {
		
		$scope.saveOrder($scope.order, function(response) {
			
			if(response.status == 'orderSaved' || response.status == 'orderFulfilled') {
				$scope.order.signupStatus = 'complete';
				if(response.status == 'orderFulfilled') {
					$scope.order.status = 'fulfilled';
					$scope.getOrder($scope.order._id);
				}
			}
			
		});
		
		
	};
    
        
}]);


controllers.controller('OrderBackCtrl', 
		['$rootScope', '$scope', '$routeParams', '$http', '$log',
		 function($rootScope, $scope, $routeParams, $http, $log) {
	
	$rootScope.setRootView('orderBack');
	
}]);
