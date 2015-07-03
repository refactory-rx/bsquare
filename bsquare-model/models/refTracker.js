module.exports = (db) => {
    
    return db.model('RefTracker', {
	
        type: String,
        userId: String,
        eventId: String
        
    });

};
