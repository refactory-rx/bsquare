module.exports = {
    
    getSettings: function() {

        var config;

        try {

          config = require("../config/settings");            
          console.log("found settings module, using variables from settings module");
        
        } catch(error) {
            if(error.code === "MODULE_NOT_FOUND") {
                console.log("settings module not found, using env variables");
                config = process.env;
            }
        }
        
        var settings = {
            
            APP_BASE_URL: config["APP_BASE_URL"],
            TICKET_SERVICE_URL: config["TICKET_SERVICE_URL"],
            APP_PATH: config["APP_PATH"],
            WEB_CONTENT_PATH: config["WEB_CONTENT_PATH"],
            HTTP_PORT: config["HTTP_PORT"],

            SENDGRID_USERNAME: config["SENDGRID_USERNAME"],
            SENDGRID_PASSWORD: config["SENDGRID_PASSWORD"],
            SENDGRID_FROM: config["SENDGRID_FROM"],
                
            DB_HOST: config["DB_HOST"],
            DB_PORT: config["DB_PORT"] || config["PG_PORT_27017_TCP_ADDR"], 
            DB_USERNAME: config["DB_USERNAME"] || "bsquare",
            DB_PASSWORD: config["DB_PASSWORD"] || "bsquare",
                
            CHECKOUT_MERCHANT_ID: config["CHECKOUT_MERCHANT_ID"],
            CHECKOUT_MERCHANT_SECRET: config["CHECKOUT_MERCHANT_SECRET"],
                
            BITPAY_API_KEY: config["BITPAY_API_KEY"],
            BITPAY_API_TOKEN: config["BITPAY_API_TOKEN"],

            COINBASE_API_KEY: config["COINBASE_API_KEY"],
            COINBASE_API_SECRET: config["COINBASE_API_SECRET"],

            COINBASE_NONCE: (new Date()).getTime()
    
        };

        return settings;

    }

};
