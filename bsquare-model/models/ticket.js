module.exports = (db) => {
    
    return db.model('Ticket', {
    
        userId: String,
        orderId: String,
        ticketResourceId: String,
        status: String,
        
        eventName: String,
        eventPlace: String,
        ticketName: String,
        price: Number,
        currency: String,
        startTime: String,
        discountCode: String,
        bundledProducts: [],
        rewards: []
        
    });

};
