module.exports = (db) => {
    
    return db.model('User', {

        emailAddress: String,
        password: String,
        pwdRecoveryToken: String,
        loginStatus: String,
        token: String,
        tokens: Object,
        lastIp: String,
        lastActiveTime: Number,
        emailVerified: String,
        sendVerificationEmail: String,
        sendRecoveryEmail: String

    });
	
};
