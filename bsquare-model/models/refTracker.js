module.exports = (db) => {
    
    let RefTracker = db.model("RefTracker", {
	    
        uuid: String,
        type: String,
        userId: String,
        eventId: String
        
    });

    return RefTracker;

};
