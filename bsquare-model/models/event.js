module.exports = (db) => {
    
    return db.model("Event", {
		
        status: String,
        user: { type: db.Schema.ObjectId, ref: "User" },
        slug: String,
        info: Object,
        layout: String,
        signupFields: [],
        refRewards: Object,
        groupRewards: Object,
        payout: Object
    
    });
	
};
