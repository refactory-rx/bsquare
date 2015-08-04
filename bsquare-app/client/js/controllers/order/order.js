controllers.controller(
    "OrderEntryCtrl", 
    ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$sce', '$interval', '$translate',
        ($rootScope, $scope, $routeParams, $http, $log, $sce, $interval, $translate) => {
	
	$rootScope.setRootView("order");
	
	$scope.orderId = $routeParams.id;
	$scope.event = {};
	
    $scope.$watch("savedOrder", (value) => {
    	
    	if(value) {
    		
    		if($scope.order) {
    			$log.debug("order changed");
    			$scope.orderChanged = true;
    			$scope.orderStatus = "changed";
    		}
    		
    		$scope.order = angular.copy(value);
    		
    		$scope.getEvent($scope.order.event);
			$scope.getInvoice($scope.order);
			
			if($scope.order.status != "fulfilled" && $scope.order.status != "timedout" && $scope.order.status != "refunded") {
				
				var now = (new Date()).getTime();
				$scope.remainingTime = 15*60*1000 - (now - $scope.order.timePlaced);
				
				console.log("remainingTime", $scope.remainingTime);
                $scope.timeCountingInterval = $interval(() => {
					$scope.remainingTime -= 1000;
					if($scope.remainingTime <= 0) {
						$scope.order.status = "timedout";
						$interval.cancel($scope.timeCountingInterval);
					}
				}, 1000);
				
			}
			
    	}
    	
		
	}, true);
	
	
    $scope.$on("destroy", () => {
		if($scope.timeCountingInterval) {
			$interval.cancel($scope.timeCountingInterval);
		}
	});
    
    
    $scope.$watch("orderId", (value) => {
        
        let orderId = $scope.orderId;
        
        if(orderId) { 
            $log.debug("orderId set: "+orderId);
            $scope.getOrder(orderId);
        }
        
    }, true);
    
    
    $scope.getOrder = (id) => {
		
		$scope.showOrderError = false;
		
		$log.debug("getting order...");
		
		$http.get("/api/orders/"+id+"?time="+(new Date()).getTime(), { headers: requestHeaders } )
        .success((response) => {
				
            $log.debug(response);
            
            if(response.status == "orderFound" || response.status == "orderCreated") {
                
                $scope.savedOrder = response.order;
                
            } else {
                $scope.showOrderError = true;
                $scope.orderStatus = "error";
                $scope.orderErrorMessage = response.message;
            }
            
        })  
        .error((data) => {
            
            $log.debug("Error: ", data);
            $scope.showOrderError = true;
            $scope.orderStatus = "error";
            $scope.orderErrorMessage = "Network error while getting order.";
            
        });
			
			
	};
	
	
    $scope.getEvent = (id) => {
		
		$log.debug("getting event "+id);
		
		$http.get("/api/events/"+id, { headers: requestHeaders } )
        .success((response) => {
            
            $log.debug(response);
            
            if(response.status === "ok") {
                $scope.event = response.event;
            }

        })
        .error((err) => {
            $scope.orderStatus = "error";
            $scope.orderErrorMessage = err.message;
            $log.debug("Error", err);
        });
			
	};
	
	
    $scope.getInvoice = (order) => {
		
		if(order.invoiceId) {
		    
		    $log.debug("getting invoice");
		    
    		$http.get("/api/invoices/"+order.invoiceId, { headers: requestHeaders } )
            .success((response) => {
                
                $log.debug(response);
                
                if(response.status === "invoiceFound") {
                    
                    let invoice = response.invoice;
                    if(invoice.status === "expired" || invoice.status === "failed") {
                        $scope.getCheckoutInvoice(order);	
                    } else {
                        $scope.invoice = response.invoice;
                    }
        
                } else if(response.status === "invoicePaid") {
                    
                    $scope.invoice = response.invoice;
                    $scope.order.tickets = response.tickets;
                    $scope.order.status = "fulfilled";
                    
                }
                
            })
            .error((data) => {
                $log.debug("Error: ", data);
            });
    			
		} else {
		    
		    $log.debug("no invoice id");
		    $scope.getCheckoutInvoice(order);
		    
		}
			
	};
	
    $scope.getCheckoutInvoice = (order) => {
		
		$http.get("/api/invoices/checkout/"+order._id, { headers: requestHeaders } )
        .success((response) => {
			
			console.log("invoice response", response);
				
            if(response.status === "ok") {

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
						if(inputNames[j] !== "$") {
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
        .error((data) => {
			$log.debug("Error: ", data);
		});
    		
	};
    		
	
    $scope.getTrustedUrl = (url) => {
		var trusted = $sce.trustAsResourceUrl(url);
		var trustedUrl = $sce.getTrustedUrl(trusted);
		return trusted;
	}
	
	
}]);

controllers.controller(
    "OrderFrontCtrl", 
    ['$rootScope', '$scope', '$routeParams', '$http', '$log', '$filter', '$translate',
    ($rootScope, $scope, $routeParams, $http, $log, $filter, $translate) => {
	
	
	$rootScope.setRootView("orderFront");
	
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

    $scope.$watch("event", (event) => {
    	
    	if(event) {

    		if($scope.event.signupFields && $scope.order.signupStatus !== "complete") {
                
                let signupFields = angular.copy($scope.event.signupFields);
                
                if($rootScope.logregStatus !== "loggedIn" || 
                   $rootScope.loggedUser.emailVerified !== "true") {
                    
                    $scope.confirmEmail = true;    
                    
                    signupFields.splice(1, 0, $scope.confirmEmailField);
                    console.log("signup flds", signupFields);

                }

                if($rootScope.logregStatus === "loggedIn") {
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
	
    $scope.createCheckoutInvoice = (callback) => {
        
        let createInvoiceRequest = {
	        type: "checkout",
	        provider: "checkout",
	        invoice: $scope.checkoutInvoice,
	        orderId: $scope.order._id
	    };
        
        $http.post("/api/invoices", createInvoiceRequest, { headers: requestHeaders } )
        .success((response) => {
			
			console.log("invoice response", response);
			
			if(response.status == "invoiceCreated") {
                callback(null, response);
            } else {
                $scope.showOrderError = true;
				$scope.orderStatus = "error";
				$scope.orderErrorMessage = err.response.message;
                callback({ response: response });
            }	
			
		})
        .error((data) => {
			console.log("Error: ", data);
			$scope.showOrderError = true;
			$scope.orderStatus = "error";
			$scope.orderErrorMessage = "Network error while creating invoice.";
            callback(data);
        });
    
    };

    $scope.payCheckout = (method) => {
	    
	    console.log("payCheckout");
	    
	    $scope.createCheckoutInvoice((err, response) => {
            
            if (!err) {
				$scope.showError = false;
				var invoice = response.invoice;
				var form = $("#payment-"+method);
				console.log("form:", form);
				form.submit();
			}
        
        });    
	    
	};
	
    $scope.goToCheckoutPage = () => {
        
	    $scope.createCheckoutInvoice((err, response) => { 
            if (!err) {
				$scope.showError = false;
                window.location.href = $scope.checkoutInvoice.url;
            } 
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
	
	
    $scope.validateForm = () => {
    	
    	console.log("validating...");
    	console.log($scope.order);
    	
    	if(!$scope.order || $scope.order.signupStatus === "complete") {
    		return;
    	}
    	
    	console.log("keep validating");
    	
    	let fields = $scope.order.signupFields;
    	
    	if(fields && fields.length > 0) {

            if($rootScope.logregStatus != "loggedIn" || $rootScope.loggedUser.emailVerified != "true") {
                $scope.confirmEmail = true;
            } else {
                console.log("confirmEmail="+$scope.confirmEmail, $rootScope.loggedUser.email+"/"+fields[0].value);
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
                    $scope.order.signupStatus = "formNotFilled";
                    return;
                }

            }
            
	    	for(let i=0; i < fields.length; i++) {
	    		if(fields[i].required == "true") {
	    			if(!fields[i].value || fields[i].value === "*") {
                        $scope.order.signupStatus = "formNotFilled";
                        return;
	    			}
	    		}
		    }
		    
		    $scope.order.signupStatus = "formFilled";
             
    	} else {
    		
    		$scope.order.signupStatus = "complete";
    	
    		
    	}
    	
    };
	
    $scope.submitSignupFields = () => {
		
        $scope.saveOrder($scope.order, (response) => {
			
			if(response.status === "orderSaved" || response.status === "orderFulfilled") {
				$scope.order.signupStatus = "complete";
				if(response.status === "orderFulfilled") {
					$scope.order.status = "fulfilled";
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
