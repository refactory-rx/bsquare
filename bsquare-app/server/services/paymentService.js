import Q from "q";
import url from "url";

import * as Errors from "../../../shared/lib/Errors";

let Order, Invoice, TicketResource;

class PaymentService {

    constructor(app) {

        ({ Order, Invoice, TicketResource } = app.model);
        
        this.app = app;
        this.coinbaseService = require("./coinbaseService")(app);
        this.checkoutService = require("./checkoutService")(app);
        this.orderService = app.orderService;
    
    }

	checkoutRequest(orderId) {
		
		let deferred = Q.defer();
		
		let response = { success: 0 };
		
    Order.findOneQ( { _id: orderId })
    .then((order) => {
        
      if (!order) {
        return deferred.reject(new Erors.NotFound(
          null, { message: "order_not_found" }
        ));
      }

      if (order.orderTotal === 0) {
          response.status = "freeOrder";
          response.message = "Order does not require invoice";
          deferred.resolve();
          return; 
      }
      
      console.log("FOUND UPDATED ORDER ********************************");
      console.log(order);
      this.provideInvoice("checkout", order, null, (result) => {
        if (result.success === 1) {
          deferred.resolve(result.invoice);
        } else {
          deferred.reject(new Errors.UnprocessableEntity(null, result));
        }
      });


    })
    .catch((err) => {
        deferred.reject(err);
    });

		
		return deferred.promise;
				
	}
	
	createInvoice(req, callback) {
		
	    let response = {
			success: 0,
			status: 'none'
		};
		
		let createInvoiceRequest = req.body;
		let orderId = createInvoiceRequest.orderId;
		
        Order.findOne( { _id: orderId }, (orderErr, order) => {
		    
		    if(orderErr) {
		        
		        response.status = 'error';
            	response.message = 'Error reading order data.';
            	response.error = orderErr;
            	callback(response);
            			    
		    } else {

		        if(order) {

                    if (order.orderTotal === 0) {
                        response.status = "freeOrder";
                        response.message = "Order does not require invoice";
                        callback(response);
                        return; 
                    }

		            let provideNewInvoice = false;
		            let invoice = createInvoiceRequest.invoice;
		            
		            if(!invoice) {
		            	provideNewInvoice = true;
		            	invoice = {};
		            }
		            
		            invoice.paidAmount = 0;
		            invoice.provider = createInvoiceRequest.provider;
		            invoice.amount = order.orderTotal;
		            invoice.currency = order.currency;
		            invoice.orderId = order._id;
		            
                    Invoice.create(invoice, (invoiceErr, createdInvoice) => {
						
						console.log(createdInvoice);
						
            			if(invoiceErr) {
            				
            				response.status = 'error';
            				response.message = 'Failed to create invoice.';
            				response.error = invoiceErr;
            			    callback(response);
            			    
            			} else {
            				
            				response.status = 'invoiceInitialized';
            				response.message = 'Invoice initialized.';
            				
            				response.invoice = createdInvoice;
                            
            			    if(provideNewInvoice) {
            			    	
                                this.provideInvoice(createInvoiceRequest.provider, order, createdInvoice, (response) => {
            			    		
            			    		console.log('invoice provided');
            			    		
            			    		if(response.success === 1) {
            			    			let providedInvoice = response.invoice;
            			    			providedInvoice.save();
            			    			order.invoiceId = createdInvoice._id.toHexString();
            			    			order.status = 'invoiced';
										order.save();
            			    		}
            			    		
            			    		response.status = 'invoiceCreated';
            			    		response.message = 'Invoice created';
            			    		
            			    		callback(response);
            			    		
            			    	});
            			    	
            			    } else {
            			    	
            			    	console.log('save order with new invoice id');
            			    	order.invoiceId = createdInvoice._id.toHexString();
            			    	order.status = 'invoiced';
								order.save();
								
								response.status = 'invoiceCreated';
            			    	response.message = 'Invoice created';
            			    	
								callback(response);
								
            			    }
            			
            			}
            			
            			
            		});
		                   
		        } else {
		            
		            response.status = 'orderNotFound';
            	    response.message = 'Order not found.';
            	    callback(response);
		            
		        }
		        
		    }
		        
		});
		
		
	}
	
	
	provideInvoice(provider, order, invoice, callback) {
		
		let response = { success: 0 };
		
		let paymentProvider;
		
		if(provider === 'coinbase') {
			paymentProvider = this.coinbaseService;
		} else if(provider === 'checkout') {
			paymentProvider = this.checkoutService;
		} else {
			response.status = 'unknownPaymentProvider';
			response.message = 'Unknown payment provider';
			callback(response);
			return;
		}	
		
    paymentProvider.createInvoice(order, (result) => {
            			        
      if(result.error) {
        
          response.status = 'error';
          response.message = 'Payment provider error.';
          response.error = result.error;
        
      } else {
	            
        if(!invoice) {
          invoice = {};
        }
                
        invoice.extData = result;
				invoice.url = result.url;
				invoice.status = result.status;
        invoice.provider = provider;
	            
        response.invoice = invoice;
        
        response.success = 1;
        response.status = 'invoiceProvided';
        response.message = 'Invoice provided.';
	            
      }
	        
	        callback(response);
	        
	    });
			
	}
	
	getInvoice(req, callback) {
		
		let response = {
			success: 0,
			status: 'none'
		};
		
		let invoiceId = req.params.id;
		let objId = invoiceId;
	    
        console.log("finding invoice...");    
        Invoice.findOne({ _id: objId }, (err, invoice) => {
		    
            console.log("found invoicve", err, invoice);
			if(err) {
				
				response.status = 'error';
				response.message = 'Error reading data.';
				response.error = err;
			    
				callback(response);
				
			} else {
					
				console.log('found invoice', invoice);	
				
				if(invoice) {
					
					this.updateInvoice(invoice, callback);
					
				} else {
							
					response.status = 'invoiceNotFound';
					response.message = 'Invoice not found.';
							
					callback(response);
							
				}
						
			}
				
			
		});
		
	}
	
    updateInvoice(invoice, callback) {

        console.log("update invoice", invoice);
        let response = { success: 0 };
				
        let paymentProvider;
        let fetchParams;
		
        if(invoice.provider === "coinbase") {
            paymentProvider = this.coinbaseService;
            fetchParams = invoice.extData.button.id;
            console.log("get by extData.id: "+invoice.extData.button.id);
        } else if(invoice.provider === "checkout") {
            paymentProvider = this.checkoutService;
            fetchParams = invoice.extData;
        } else {
            response.status = "unknownPaymentProvider";
            response.message = "Unknown payment provider";
            callback(response);
            return;
        }
		
        paymentProvider.fetchInvoice(fetchParams, (fetchInvoiceResult) => {
		       
            if(fetchInvoiceResult.error) {
		        
                response.status = 'error';
                response.message = 'Payment provider error.';
                response.error = fetchInvoiceResult.error;
		        
                callback(response);
		        
            } else if(fetchInvoiceResult.status == 'invalidResponse') {

                response.status = 'error';
                response.message = 'Payment provider error.';
		        
                callback(response);

            } else {
		        
                console.log('fetchInvoiceResult', fetchInvoiceResult);
		        
                let origStatus = invoice.status;
                invoice.status = fetchInvoiceResult.status;
                
                if(fetchInvoiceResult.extData) {
                    
                    if(invoice.provider == 'coinbase') {
                        invoice.extData = fetchInvoiceResult.extData;
                    } else if(invoice.provider == 'checkout') {
                        invoice.extData.status = fetchInvoiceResult.extData.status;
                    }
                  
                    Invoice.update({ _id: invoice._id }, { status: invoice.status, extData: invoice.extData }, (err, numUpdated) => {
                        console.log("updated status of "+numUpdated+" invoices, errs: ", err);
                    });
                
                }
		        
                let statusFields = { paymentStatus: invoice.status };
                
                if(invoice.status == 'failed') {
                    statusFields.status = 'paymentFailed';
                }
                
                Order.update({ invoiceId: invoice._id.toHexString() }, statusFields, (err, rowsAffected) => {
                    console.log('updated payment status for '+rowsAffected+' order');	
                });
		       
                console.log('orig status: '+origStatus+', current status: '+invoice.status);	
		        
                if((origStatus == 'new' || origStatus == 'pending') && (invoice.status == 'paid' || invoice.status == 'confirmed')) {
		            
                    //console.log("invoice", invoice);     
                    this.orderService.fulfillOrder(invoice.orderId, (fulfillOrderResult) => {

                        //console.log(fulfillOrderResult);

                        if(fulfillOrderResult.success == 1) { 
                            
                            response.success = 1;
                            response.status = 'invoicePaid';
                            response.invoice = invoice;
                            response.tickets = fulfillOrderResult.tickets;

                        } else {
                            
                            response.status = 'error';
                            response.message = 'Could not fulfill order.';
                            response.error = fulfillOrderResult.error;
                            
                        }

                        callback(response);
		                
		            });
		            
		        } else {
		        
		            response.success = 1;
		            response.status = 'invoiceFound';
		            response.invoice = invoice;        
		            
		            callback(response);
		             
		        }
		        
		    }
		     
		});
			
	}
	
	modifyInvoices(req, callback) {
		
		let modifications = req.body;
		
        let operations = modifications.map((modification) => {
			return this.modifyInvoice(modification);	
		});
		
        Q.all(operations).then((responses) => {
			
			console.log('modify invoice responses', responses);
			
			let response = { success: 1, status: 'invoicesModified' };
			
			let errorResponses = [];
			for(let i=0; i < responses.length; i++) {
				if(responses[i].success === 0) {
					errorResponses.push(responses[i]);
				}
			}
			
			if(errorResponses.length > 0) {
				response.success = 0;
				response.status = 'invoiceModificationErrors';
				response.errors = errorResponses;
			}
			
			response.refundedNum = operations.length - errorResponses.length;
			
			callback(response);
			
		});
		
	}
	
	
	modifyInvoice(modification) {
		
		let deferred = Q.defer();
		
		let invoiceId = modification.invoiceId;
		let objId = invoiceId;
		
		let response = { success: 0 };
					
        Invoice.findOne({ _id: objId }, (err, invoice) => {
			
			if(err) {
				deferred.resolve(response);
			} else {
				
				let paymentProvider;
					
				if(invoice.provider === 'coinbase') {
					paymentProvider = this.coinbaseService;
				} else if(invoice.provider === 'checkout') {
					paymentProvider = this.checkoutService;
				} else {
					response.status = 'unknownPaymentProvider';
					response.message = 'Unknown payment provider';
					deferred.resolve(response);
					return;
				}
				
			
				if(modification.type === 'refund') {
					
                    paymentProvider.refundInvoice(invoice, (result) => {
						
						if(result.status === 'invoiceRefunded') {
							
							response.success = 1;
							response.status = 'invoiceRefunded';
							
                            Invoice.update({ _id: invoice._id }, { status: 'refunded' }, (err, numAffected) => {
								
							});
							
                            Order.update({ _id: invoice.orderId }, { status: 'refunded' }, (err, numAffected) => {
								
							});
							
							deferred.resolve(response);
							
						} else {
							response.status = 'invoiceRefundFailed';
							response.error = result.error;
							deferred.resolve(response);
						}
						
						
					});
					
				} else {
					response.status = 'uknownOperationType';
					deferred.resolve(response);
				}
				
			}
				
		});
		
		return deferred.promise;
		
	}
    
    initRoutes() {
        let paymentServiceRoutes = require("./paymentServiceRoutes");
        paymentServiceRoutes.init(this.app);
    }
		
}

module.exports = (app) => {
    return new PaymentService(app);
};
