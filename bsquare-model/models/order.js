module.exports = (db) => {
    
    return db.model("Order", {

        status: String,
        paymentStatus: String,
        signupStatus: String,
        signupFields: [],
        invoiceId: String,
        event: { type: db.Schema.ObjectId, ref: "Event" },
        user: { type: db.Schema.ObjectId, ref: "User" },
        items: [],
        tickets: [],
        orderTotal: Number,
        currency: String,
        timePlaced: Number,
        groupTrackerId: String,
        refTrackerId: String
        
    });

};
