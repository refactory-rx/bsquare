var https = require('https');
var http = require('http');

module.exports = {
    
    httpPost: function(options, payload, callback) {
        module.exports.post(http, options, payload, callback);
    },
    
    httpsPost: function(options, payload, callback) {
        module.exports.post(https, options, payload, callback);
    },
    
    post: function(protocol, options, payload, callback) {
        
        var response = {
            success: 0
        };
        
        var req = protocol.request(options, function(res) {
            
            var data = '';
            
            res.on('data', function(chunk) {
                data += chunk;
            });
            
            res.on('end', function() {
                
                response.success = 1;
                response.data = data;
                callback(response);
                
            });
            
        });
        
        req.on('error', function(err) {
            response.data = err;
            callback(response);
        });
        
        req.setHeader('Content-Type', 'application/json');
        var str = JSON.stringify(payload);
        req.setHeader('Content-Length', str.length);
        req.end(str);
        
    },
    
    
    httpGet: function(url, callback) {
        module.exports.get(http, url, callback);
    },
    
    httpsGet: function(url, callback) {
        module.exports.get(https, url, callback);
    },
    
    get: function(protocol, url, callback) {
        
        var response = {
            success: 0
        };
        
        protocol.get(url, function(res) {
            
            ////console.log("statusCode: ", res.statusCode);
            ////console.log("headers: ", res.headers);
            
            var data = '';
            
            res.on('data', function(chunk) {
                data += chunk;
            });
            
            res.on('end', function() {
                
                response.success = 1;
                response.data = data;
                callback(response);
                
            });

        }).on('error', function(e) {
        
            console.error(e);
            response.data = e;
            callback(response);
            
        });
        
    }
	
    
};