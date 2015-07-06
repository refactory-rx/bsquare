let passwordHash = require("password-hash");
let crypto = require("crypto");

let User, Profile;

let confirmEmailText =
	"<p>Thanks for registering. Please, confirm your e-mail by clicking the following link:"+
	"<br/><br/>"+
	"{{link}}"+
	"<br/><br/>"+
	"Keikkapalvelu Ax</p>";

let recoverPasswordEmailText =
	"<p>You have requested to reset your password. Click the following link to proceed:"+
	"<br/><br/>"+
	"{{link}}"+
	"<br/><br/>"+
	"Keikkapalvelu Ax</p>";

class LoginService {
    
    constructor(app) {
        this.app = app;
        this.authService = app.authService;
        this.sendgrid = require("sendgrid")(app.settings.SENDGRID_USERNAME, app.settings.SENDGRID_PASSWORD);
        ({ User, Profile } = app.model);
    }

	getProfile(req, callback) {
		
        this.authService.screenRequest(req, true, (result) => {
			
			if(result.status === "authorized") {
				
				let response = {
					success: 0,
					status: "none"
				};
				
				let profile = result.profile;
				
				if(profile) {
					response.success = 1;
					response.status = "gotProfile";
					response.message = "Got profile";
					response.profile = profile;
				} else {
					response.status = "profileNotFound";
					response.message = "Could not find profile.";
				}
				
				callback(response);
				
			} else {
				callback(result);
			}
			
		});
		
	}	
	
	saveProfile(req, callback) {
		
        this.authService.screenRequest(req, true, (result) => {
			
			if(result.status == "app.authService.rized") {
				
				let response = {
					success: 0,
					status: "none"
				};
				
				let saveProfileRequest = req.body;
				let profile = saveProfileRequest.profile;
				let profileId = profile._id;
				delete profile._id;
				
                Profile.update( { _id: profileId }, profile, (err, numAffected) => {
					
					if(err) {
						response.status = "error";
						response.message = "Failed to save profile";
						response.error = err;
					} else {
						response.success = 1;
						response.status = "profileSaved";
						response.message = "Profile saved.";
					}
					
					callback(response);
					
				});
				
			} else {
				callback(result);
			}
			
		});
		
	}
	
	expireTimedOutSessions() {
		
		let maxTime = (new Date()).getTime()-(1000*60*60*12);
		
        let query = {
            loginStatus: { $ne: "loggedOut" },
			lastActiveTime: {  $lt: maxTime }
		};
		
        User.find(query, (err, users) => {
            
            if(err) {
				console.log(err);
			} else {
				for(let i=0; i < users.length; i++) {
					this.expireUser(users[i]);
				}	
			}
			
		});
	
	}
	
	expireUser(user) {
		
		user.tokens = {};
		user.loginStatus = "loggedOut";
	    
        user.save((err) => { 
			if(err) { console.log(err); }
		});
			
	}	
	
	sendPendingEmails() {
		
		console.log("run send pending emails");
		
        User.find({ sendVerificationEmail: "true" }, (err, users) => {
		    
            if(err) {

                console.log(err);

            } else if(users && users.length > 0) {

                for(let i=0; i < users.length; i++) {
                    
                    let user = users[i];
                    
                    let verifyUrl = APP_BASE_URL+"/#/verify/"+user._id;
                    let link = `<a href="${verifyUrl}">${verifyUrl}</a>`;
                    let emailText = confirmEmailText.replace("{{link}}", link);
                    
                    user.sendVerificationEmail = "false";
                    user.save();
                    
                    this.sendEmail(user.emailAddress, "Email verification request", emailText, emailText);
                    
                }

            }	
        
        });

        User.find({ sendRecoveryEmail: "true" }, (err, users) => {
			
            if(err) {

                console.log(err);

            } else if(users && users.length > 0) {

                console.log("pwd reset requests: "+users.length);
                
                for(let i=0; i < users.length; i++) {
                    
                    let user = users[i];
                    
                    let recoverUrl = APP_BASE_URL+"/#/recover/"+user.pwdRecoveryToken;
                    let link = `<a href="${recoverUrl}">${recoverUrl}</a>`;
                    let emailText = recoverPasswordEmailText.replace("{{link}}", link);
                    
                    user.sendRecoveryEmail = "false";
                    user.save();
                    
                    this.sendEmail(user.emailAddress, "Password recovery", emailText, emailText);
                    
                }

            }
			
		});
			
		
	}
	
	sendEmail(emailAddress, emailSubject, emailText, emailHtml) {
		
		console.log("sending password reset email...", emailAddress, emailSubject);
		
		this.sendgrid.send({
    		to: emailAddress,
		  	from: SENDGRID_FROM,
		  	subject: emailSubject,
		  	text: emailText,
		  	html: emailHtml
        }, (err, json) => {
		  	if (err) { return console.error(err); }
		  	console.log(json);
		});
			
	}
	
	start() {
		
		let expTime = 1000 * 60; // 1 hour
		
		this.expireTimedOutSessions();
		this.sendPendingEmails();
		
		setInterval(this.sendPendingEmails, 60000);
		setInterval(this.expireTimedOutSessions, expTime);
		
	}	
    
    initRoutes() {
        let loginServiceRoutes = require("./loginServiceRoutes");
        loginServiceRoutes.init(this.app);
    }

}

module.exports = (app) => {
    return new LoginService(app);
};
