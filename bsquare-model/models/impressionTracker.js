module.exports = (db) => {
    
    return db.model('ImpressionTracker', {
	
        viewType: String,
        entityId: String,
        userId: String,
        remoteIp: String,
        refTrackerId: String,
        count: Number

    });
	
};
