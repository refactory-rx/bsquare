var https = require('https');
//var bitpay  = require('bitpay');
var fs = require('fs');

module.exports = {
    
    createInvoice: function(order, callback) {
        
        var newInvoice = {
            "orderID":              order._id,
            "itemDesc":             "Event ticket order",
            "itemCode":             "tickets",
            "notificationEmail":    "vhalme@gmail.com",
            // "notificationURL":      "https://yourdomain.com:8000/notification",
            "redirectURL":          "http://btcmachin.es:8080/#/order/"+order._id,
            "posData":              "tickets:"+order._id,
            "price":                order.orderTotal*0.01,
            "currency":             "EUR",
            "physical":             false,
            "fullNotifications":    true,
            "transactionSpeed":     "high",
            "buyerName":            "Satoshi Nakamoto",
            "buyerAddress1":        "123 Main St.",
            "buyerAddress2":        "",
            "buyerCity":            "Roswell",
            "buyerState":           "GA",
            "buyerZip":             "30075",
            "buyerCountry":         "USA",
            "buyerEmail":           "satoshi@hushmail.com",
            "buyerPhone":           "678-555-1212"
        };
        
        var options = {
            host: 'bitpay.com',
            port: 443,
            path: '/api/invoice/',
            method: 'POST',
            auth: BITPAY_API_KEY+':',
            agent: false,
            //rejectUnauthorized: true,
        };
        
        /*
        var privKey = fs.readFileSync('/root/.bitpay/api.key');
        console.log(privKey);
        var client  = bitpay.createClient(privKey);
        console.log('bitpay client created');
        
        client.on('error', function(error) {
            console.log('error', error);
            client.get('invoices', function(err, invoices) {
                console.log(err || invoices);
            });
        });

        client.on('ready', function() {
            console.log('bitpay client ready');
            client.get('invoices', function(err, invoices) {
                console.log(err || invoices);
            });
        });
        */
        
        
        var req = https.request(options, function(res) {
            
            var data = '';
            res.on('data', function(chunk) {
                data += chunk;
            });
            
            res.on('end', function() {
            
                var result = JSON.parse(data);
                callback(result);
    
            });
  
        });
  
        req.on('error', function(err) {
            callback({error: {type: 'socketError', message: err.message}});
        });
    
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('X-BitPay-Plugin-Info', 'node033114');
        var str = JSON.stringify(newInvoice);
        req.setHeader('Content-Length', str.length);
        req.end(str);
        

    },
    
    fetchInvoice: function(invoiceId, callback) {
        
        var options = {
            host: 'bitpay.com',
            port: 443,
            path: '/api/invoice/'+invoiceId,
            method: 'GET',
            auth: BITPAY_API_KEY + ':',
            agent: false,
            rejectUnauthorized: true,
        };

        var req = https.request(options, function(res) {
            
            var data = '';
            
            res.on('data', function(chunk) {
                data += chunk;
            });
            
            res.on('end', function() {
                var obj = JSON.parse(data);
                callback(obj);
            });
            
        });
    
        req.on('error', function(err) {
            callback({error: {type: 'socketError', message: err.message}});
        });
        
        req.end();
        
    },
    
    
    refundInvoice: function(invoice, callback) {
    
        var response = {
            success: 0,
            status: 'refiundNotSupported',
            error: { message: 'Not supported' }
        };
        
        callback(response);
        
    }
    

};

