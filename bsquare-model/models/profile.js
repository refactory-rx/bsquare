module.exports = (db) => {
    
    return db.model('Profile', {
	
        user: { type: db.Schema.ObjectId, ref: 'User' },
        displayName: String,
        firstName: String,
        lastName: String,
        phoneNumber: String,
        addressStreet: String,
        addressPostalCode: String,
        addressCity: String,
        addressCountry: String,
        language: String
         
    });

};
