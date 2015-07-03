var PAYMENT_URL = 'https://payment.checkout.fi/';
var QUERY_URL = 'https://rpcapi.checkout.fi/poll';
var REFUND_URL = 'https://rpcapi.checkout.fi/refund2';

var crypto = require('crypto');
var utf8 = require('utf8');
var formUrlEncoded = require('form-urlencoded');
var xml2js = require('xml2js');
var request = require('request');

let APP_BASE_URL, CHECKOUT_MERCHANT_ID, CHECKOUT_MERCHANT_SECRET;

function formatDate(date) {
    
    var month = '' + (date.getMonth() + 1);
    var day = '' + date.getDate();
    var year = date.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('');

}

class CheckoutService {

    constructor(app) {
        ({ APP_BASE_URL, CHECKOUT_MERCHANT_ID, CHECKOUT_MERCHANT_SECRET } = app.settings);
    }

    createDict(order) {
        
        var orderId = order._id.toHexString();
        
        console.log(order.items);
        
        var stamp = orderId.substring(0, 12);
        var ref = orderId.substring(orderId.length-12, orderId.length)
        
        var message = '';
        for(var i=0; i < order.items.length; i++) {
            message += order.items[i].name+' x '+order.items[i].quantity+', ';
        }
        
        message = message.substring(message.length-2, message.length);

        var postDict = {
            
            'VERSION': '0001',
            'STAMP': Math.ceil((new Date()).getTime()/1000),
            'AMOUNT': 100 * order.orderTotal,
            'REFERENCE': ref,
            'MESSAGE': message,
            'LANGUAGE': 'FI',
            "RETURN": `${APP_BASE_URL}/#/order/${orderId}`,
            "CANCEL": `${APP_BASE_URL}/#/order/${orderId}`,
            "REJECT": `${APP_BASE_URL}/#/order/${orderId}`,
            "DELAYED": `${APP_BASE_URL}/#/order/${orderId}`,
            'CURRENCY': 'EUR',
            'CONTENT': '1',
            'TYPE': '0',
            'ALGORITHM': '3',
            'DELIVERY_DATE': formatDate(new Date()),
            
            'PHONE': '0445223553',
            'EMAIL': 'vhalme@gmail.com',
            'FIRSTNAME': 'Vladimir',
            'FAMILYNAME': 'Halme',
            'ADDRESS': 'Sturenkatu 37-41 B 16',
            'POSTCODE': '00550',
            'POSTOFFICE': 'Helsinki',
            'COUNTRY': 'FIN'
            
        };
        
        postDict['MERCHANT'] = CHECKOUT_MERCHANT_ID;
        postDict['DEVICE'] = '10'; // "10" to get XML data for payment methods back
        postDict['MAC'] = this.calculatePaymentMd5(postDict, CHECKOUT_MERCHANT_SECRET);
        
        return postDict;
        
    }
    
    calculatePaymentMd5(params, merchantSecret) {
        
        var fields = [params["VERSION"], params["STAMP"], params["AMOUNT"], params["REFERENCE"],
            params["MESSAGE"], params["LANGUAGE"], params["MERCHANT"], params["RETURN"],
            params["CANCEL"], params["REJECT"], params["DELAYED"], params["COUNTRY"],
            params["CURRENCY"], params["DEVICE"], params["CONTENT"], params["TYPE"],
            params["ALGORITHM"], params["DELIVERY_DATE"], params["FIRSTNAME"], params["FAMILYNAME"],
            params["ADDRESS"], params["POSTCODE"], params["POSTOFFICE"], merchantSecret]
        
        var base = fields.join('+');
        var encoded = utf8.encode(base);
        var hash = crypto.createHash('md5').update(encoded);
        var digest = hash.digest('hex').toUpperCase();
        
        return digest;
        
    }
    
    createQueryDict(invoice) {
        
        var stamp = invoice.trade.stamp[0];
        var ref = invoice.trade.reference[0];
        var amount = invoice.trade.payments[0].payment[0].amount[0];
        
        console.log(stamp, ref, amount);
        
        var postDict = {
            
            'VERSION': '0001',
            'STAMP': stamp,
            'AMOUNT': amount,
            'REFERENCE': ref,
            'FORMAT': '1',
            'CURRENCY': 'EUR',
            'ALGORITHM': '3',
            'MERCHANT': CHECKOUT_MERCHANT_ID
        };
        
        postDict['MAC'] = this.calculateQueryMd5(postDict, CHECKOUT_MERCHANT_SECRET);
        
        return postDict;
        
    }
    
    calculateQueryMd5(params, merchantSecret) {
        
        var fields = [params["VERSION"], params["STAMP"], params["REFERENCE"], 
            params["MERCHANT"], params["AMOUNT"], params["CURRENCY"], params["FORMAT"], 
            params["ALGORITHM"], merchantSecret]
        
        var base = fields.join('+');
        var encoded = utf8.encode(base);
        var hash = crypto.createHash('md5').update(encoded);
        var digest = hash.digest('hex').toUpperCase();
        
        return digest;
        
    }
    
    createRefundDict(invoice) {
        
        console.log(invoice);
        
        var stamp = invoice.extData.trade.stamp[0];
        var ref = invoice.extData.trade.reference[0];
        var amount = invoice.extData.trade.payments[0].payment[0].amount[0];
        
        console.log(stamp, ref, amount);
        
        var postDict = {
            
            'VERSION': '0001',
            'STAMP': stamp,
            'AMOUNT': amount,
            'REFERENCE': ref,
            'FORMAT': '1',
            'CURRENCY': 'EUR',
            'ALGORITHM': '3',
            'MERCHANT': CHECKOUT_MERCHANT_ID
        };
        
        postDict['MAC'] = this.calculateRefundMd5(postDict, CHECKOUT_MERCHANT_SECRET);
        
        return postDict;
        
    }
    
    calculateRefundMd5(params, merchantSecret) {
        
        var fields = [params["VERSION"], params["STAMP"], params["REFERENCE"], 
            params["MERCHANT"], params["AMOUNT"], params["CURRENCY"], params["FORMAT"], 
            params["ALGORITHM"], merchantSecret]
        
        var base = fields.join('+');
        var encoded = utf8.encode(base);
        var hash = crypto.createHash('md5').update(encoded);
        var digest = hash.digest('hex').toUpperCase();
        
        return digest;
        
    }
    
    createInvoice(order, callback) {
        
        var postDict = this.createDict(order);
        
        var encodedData = formUrlEncoded.encode(postDict);
        
        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'gzip, deflate',
            'Accept': '*/*'
        };
        
        request.post({ headers: headers, url: PAYMENT_URL, body: encodedData }, (err, response, data) => {
            
            if(err) {
                
                console.log(err);
			    callback({ error: { message: err.message } });
                
            } else {
                
                var result = data;
                
                xml2js.parseString(data, (err, obj) => {
                    
                    if(err) {
                        callback({ error: { message: err.message } });
                    } else {
                        result = obj;
                        console.log(result);
                        var trade = result.trade;
                        console.log(trade.paymentURL);
                        result.status = 'new';
                        result.url = trade.paymentURL[0];
                        callback(result);
                    }
                
                });
                
			    
            }
            
        });  
        
    }
    
    fetchInvoice(invoice, callback) {
        
        console.log('checkoutService.fetchInvoice');
        
        var postDict = this.createQueryDict(invoice);
        
        var encodedData = formUrlEncoded.encode(postDict);
        
        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'gzip, deflate',
            'Accept': '*/*'
        };
        
        request.post({ headers: headers, url: QUERY_URL, body: encodedData }, (err, response, data) => {
            
            if(err) {
                
                console.log(err);
			    callback({ error: { message: err.message } });
                
            } else {
                
                var result = data;
                
                xml2js.parseString(data, (err, obj) => {
                    
                    if(err) {
                        callback({ error: { message: err.message } });
                    } else {
                        
                        var result = { 
                            success: 1,
                            extStatus: obj.trade.status[0],
                            extData: obj.trade
                        };
                        
                        var status = parseInt(result.extStatus);
                        
                        if(status === 1) {
                            result.status = 'pending';
                        } else if(status >= 2 && status !== 3) {
                            result.status = 'paid';
                        } else {
                            result.status = 'failed';
                        }
                        
                        callback(result);
                        
                    }
                
                });
                
			    
            }
            
        });
        
    }
    
    refundInvoice(invoice, callback) {
         
        console.log('checkoutService.refundInvoice');
        
        var stamp = invoice.extData.trade.stamp[0];
        var ref = invoice.extData.trade.reference[0];
        var amount = invoice.extData.trade.payments[0].payment[0].amount[0];
        var nonce = (new Date()).getTime();

        var requestXml = 
            '<?xml version="1.0"?>'+
                '<checkout>'+
                    '<identification>'+
                        '<merchant>'+CHECKOUT_MERCHANT_ID+'</merchant>'+
                        '<stamp>'+nonce+'</stamp>'+
                    '</identification>'+
                    '<message>'+
                        '<refund>'+
                            '<stamp>'+stamp+'</stamp>'+
                            '<reference>'+ref+'</reference>'+
                            '<amount>'+amount+'</amount>'+
                            '<receiver>'+
                                '<email>email@osoi.te</email>'+
                            '</receiver>'+
                        '</refund>'+
                    '</message>'+
                '</checkout>';
            
         
        var hmac = crypto.createHmac('SHA256', CHECKOUT_MERCHANT_SECRET);
        var encoded = new Buffer(utf8.encode(requestXml)).toString('base64')
        var hash = hmac.update(encoded).digest('hex').toUpperCase();
        
        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };
            
        var requestContent = {
            'data': encoded,
            'mac': hash
        };
         
        var encodedData = formUrlEncoded.encode(requestContent);
        
        request.post({ headers: headers, url: REFUND_URL, body: encodedData }, (err, response, data) => {
            
            //console.log(response.request.body);

            if(err) {
                
                console.log(err);
			    callback({ status: 'invoiceRefundFailed', error: { message: err.message } });
                
            } else {
                
                var result = { success: 0 };
                
                xml2js.parseString(data, (err, obj) => {
                    
                    if(err) {
                        
                        result.status = 'refundResponseParseError';
                        result.error = err;
                        
                        callback(result);
                    
                    } else {
                        
                        var response = obj.checkout.response[0];

                        console.log('refund response', obj.checkout.response[0]);

                        if(response.statusCode && 
                            response.statusCode.length > 0 &&
                            response.statusCode[0] == '2100') {
                            
                            result.success = 1;
                            result.status = 'invoiceRefunded';

                        } else {
                            
                            result.status = 'refundFaled';
                            result.error = response;

                        }
                        
                        callback(result);
                        
                    }
                
                });
                
			    
            }
            
        });
        
        
    }
    
}

module.exports = (app) => {
    return new CheckoutService(app);
};

