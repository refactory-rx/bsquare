var settings;

try {
    settings = require('../config/settings');
    console.log('found settings module, using variables from settings module');
} catch(error) {
    if(error.code === 'MODULE_NOT_FOUND') {
        console.log('settings module not found, using env variables');
        settings = process.env;
    }
}

APP_BASE_URL = settings['APP_BASE_URL'];
APP_PATH = settings['APP_PATH'];
WEB_CONTENT_PATH = settings['WEB_CONTENT_PATH'];
TICKET_SERVICE_URL = settings['TICKET_SERVICE_URL'];

SENDGRID_USERNAME = settings['SENDGRID_USERNAME'];
SENDGRID_PASSWORD = settings['SENDGRID_PASSWORD'];
SENDGRID_FROM = settings['SENDGRID_FROM'];
 
DATABASE_URL = settings['DATABASE_URL'];
    
