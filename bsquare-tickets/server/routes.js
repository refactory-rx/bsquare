var ticketService = require('./services/ticketService');

module.exports = function(app) {
    
    ticketService.init(app);	
    	
};
