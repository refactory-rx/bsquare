module.exports = (db) => {
    
    return db.model('OrdersByTicketResource', {

        ticketResourceId: String,
        orderIds: []
	
    });

};
