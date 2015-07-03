var fs = require('fs');
var request = require('request');
var crypto = require('crypto');

let COINBASE_NONCE, COINBASE_API_SECRET, COINBASE_API_KEY;

class CoinbaseService {

    constructor(app) {
        ({ COINBASE_NONCE, COINBASE_API_SECRET, COINBASE_API_KEY } = app.settings);
    }

    createHeaders(url, json) {
        
        COINBASE_NONCE += 10;
        var time = (new Date()).getTime();
        //if(time > COINBASE_NONCE) {
        //    COINBASE_NONCE = time;
        //};
        
        var nonce = 100+time; //COINBASE_NONCE;

        console.log('nonce: '+nonce);
        
        var message = nonce + url;

	    if(json) {
            message += JSON.stringify(json);
        }
        
        console.log('message: '+message);

        var hash = crypto.createHmac('SHA256', COINBASE_API_SECRET).update(message).digest('hex');
	    console.log('hash: '+hash);

	    var headers = {
	        'User-Agent': 'NodeJS',
	        'Content-Type': 'application/json',
	        'ACCESS_KEY': COINBASE_API_KEY,
	        'ACCESS_SIGNATURE': hash,
	        'ACCESS_NONCE': nonce
	    };

        return headers;

    }
    
    getOrdersForButton(buttonId, callback) {
        
        var uri = 'https://api.coinbase.com/v1/buttons/'+buttonId+'/orders';
	    var headers = this.createHeaders(uri);
        
	    var options = {
	        uri: uri,
	        method: 'GET',
	        headers: headers
	    };

        request(options, (err, res, body) => {
            
            console.log('available orders for button response', body);
            
            if(err) {
                console.log(err);
                callback([]);
            } else {
                var result = JSON.parse(body);
                var orders = result.orders;
                callback(orders);
            }

        });

    }

    createOrderForButton(buttonId, callback) {
         
        var uri = 'https://api.coinbase.com/v1/buttons/'+buttonId+'/create_order';

	    var headers = this.createHeaders(uri);
        
	    var options = {
	        uri: uri,
	        method: 'POST',
	        headers: headers
	    };

        request(options, (err, res, body) => {
            var result = JSON.parse(body);
            var order = result.order;
            console.log('created order for button '+buttonId, order);
            callback(order);
        });

    }

    createInvoice(order, callback) {
	 
        var json = {
            'button': {
            'name': 'test',
            'type': 'buy_now',
            'subscription': false,
            'price_string': ''+(order.orderTotal*0.01),
            'price_currency_iso': 'EUR',
            'custom': order._id,
            'description': 'Sample description',
            'style': 'custom_large',
            //'include_email': true,
            'success_url': 'http://localhost/#/order/'+order._id,
            'cancel_url': 'http://localhost/#/order/'+order._id,
            }
        };

        var uri = 'https://api.coinbase.com/v1/orders';
        
        var headers = this.createHeaders(uri, json);
        
        var options = {
            uri: uri,
            method: 'POST',
            headers: headers,
            json: json
        };
        
        console.log(options);

        request(options, (err, res, body) => {
            
            var result = body;
            var order = result.order;
            order.url = 'https://www.coinbase.com/checkouts/'+order.button.id;
            callback(order);
                    
        });

        

    }
    
    fetchInvoice(buttonId, callback) {
	    
        this.getOrdersForButton(buttonId, (orders) => {

		    var result = { success: 0 };
            
            if(orders.length > 1) {
		        
                var order = orders[orders.length-1].order;
            
                if(order.status == 'new') {
                    result.status = 'pending';
                } else if(order.status == 'completed') {	
                    result.status = 'paid';
                } else {
                    result.status = 'failed';
                }
                
                result.success = 1;
                result.extData = order;
                result.extStatus = order.status;

            } else {
                
                result.status = 'invalidResponse';
            
            }

            callback(result);
            
	    });
        
    }
    
    refundInvoice(invoice, callback) {
        
        //console.log(invoice);

        var response = { success: 0 };
        
        var uri = 'https://api.coinbase.com/v1/orders/'+invoice.extData.id+'/refund';
        var json = {
            'order': {
                'refund_iso_code': 'BTC',
                'transaction': {
                    'user_fee': '0.0001'
                }
            }
        };
        
        var headers = this.createHeaders(uri, json);
        var options = {
            uri: uri,
            method: 'POST',
            headers: headers,
            json: json
        };
        
        console.log('calling request at '+(new Date()).getTime(), headers);

        request(options, (err, res, result) => {  
            
            if(err) {
                response.status = 'refundRequestFailed';
                response.error = err.message;
                console.log(err);
            } else {

                console.log(result);
                
                if(result.error && result.error.substring(0, 12) == 'Invalid HMAC') {
                    console.log('Invalid nonce, retrying...');
                    this.refundInvoice(invoice, callback);
                    return;
                }

                if(result.errors) {
                    response.status = 'refundFailed';
                    response.error = result.errors;
                } else {    
                    var order = result.order;
                    response.success = 1;
                    response.status = 'invoiceRefunded';
                    response.refundAddress = order.refund_address;
                }
            }
            
            callback(response);
        
        });
        
    }

}

module.exports = (app) => {
    return new CoinbaseService(app);
};

