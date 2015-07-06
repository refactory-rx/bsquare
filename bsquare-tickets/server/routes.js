var ticketService = require('./services/ticketService');

module.exports = function(app) {
    
    app.ticketService.initRoutes();	
    	
};
