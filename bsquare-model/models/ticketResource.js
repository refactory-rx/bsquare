module.exports = (db) => {
    
    return db.model('TicketResource', {

        event: { type: db.Schema.ObjectId, ref: 'Event' },
        eventName: String,
        eventStarts: String,
        eventPlace: String,
        name: String,
        description: String,
        quantity: Number,
        qtySold: Number,
        qtyAvailable: Number,
        qtyReserved: Number,
        price: Number,
        currency: String,
        allowedPerOrder: Number,
        salesStart: Number,
        salesEnd: Number,
        bundledProducts: [],
        isPublic: Boolean,
        authorizedInvalidation: Boolean

    });

};
