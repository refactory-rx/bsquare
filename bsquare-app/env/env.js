module.exports = {
    
    getSettings: function() {

        var config;

        try {
            config = require('../config/settings');
            console.log('found settings module, using variables from settings module');
        } catch(error) {
            if(error.code === 'MODULE_NOT_FOUND') {
                console.log('settings module not found, using env variables');
                config = process.env;
            }
        }
        
        var settings = {
            
            APP_BASE_URL: config['APP_BASE_URL'],
            TICKET_SERVICE_URL: config['TICKET_SERVICE_URL'],
            APP_PATH: config['APP_PATH'],
            WEB_CONTENT_PATH: config['WEB_CONTENT_PATH'],

            SENDGRID_USERNAME: config['SENDGRID_USERNAME'],
            SENDGRID_PASSWORD: config['SENDGRID_PASSWORD'],
            SENDGRID_FROM: config['SENDGRID_FROM'],
                
            MAIL_USERNAME: config['MAIL_USERNAME'],
            MAIL_PASSWORD: config['MAIL_PASSWORD'],
            MAIL_FROM: config['MAIL_FROM'],
                
            DATABASE_URL: config['DATABASE_URL'],
                
            CHECKOUT_MERCHANT_ID: config['CHECKOUT_MERCHANT_ID'],
            CHECKOUT_MERCHANT_SECRET: config['CHECKOUT_MERCHANT_SECRET'],
                
            BITPAY_API_KEY: config['BITPAY_API_KEY'],
            BITPAY_API_TOKEN: config['BITPAY_API_TOKEN'],

            COINBASE_API_KEY: config['COINBASE_API_KEY'],
            COINBASE_API_SECRET: config['COINBASE_API_SECRET'],

            COINBASE_NONCE: (new Date()).getTime()
    
        };

        return settings;

    }

};
