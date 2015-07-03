module.exports = (db) => {
    
    return db.model('Message', {
    
        status: String,
        type: String,
        from: String,
        to: [],
        subject: String,
        text: String,
        html: String,
        time: Number,
        eventId: String
    
    });

};
