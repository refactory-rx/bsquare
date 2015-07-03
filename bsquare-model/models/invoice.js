module.exports = (db) => {
    
    return db.model('Invoice', {
    
        type: String,
        provider: String,
        orderId: String,
        status: String,
        amount: Number,
        paidAmount: Number,
        currency: String,
        url: String,
        extData: Object,
        extId: String

    });

};
