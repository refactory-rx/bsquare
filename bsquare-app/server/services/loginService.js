let passwordHash = require("password-hash");
let crypto = require("crypto");

import translations from "../../../shared/translations";

let User, Profile;

let APP_BASE_URL, SENDGRID_FROM, SENDGRID_USERNAME, SENDGRID_PASSWORD;

class LoginService {
    
    constructor(app) {

        ({ APP_BASE_URL, SENDGRID_FROM, SENDGRID_USERNAME, SENDGRID_PASSWORD } = app.settings);
        ({ User, Profile } = app.model);
        this.app = app;
        this.authService = app.authService;
        this.sendgrid = require("sendgrid")(SENDGRID_USERNAME, SENDGRID_PASSWORD);
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

	sendPendingEmails() {
		
		console.log("run send pending emails");
	    
        User.find({ sendVerificationEmail: "true" }, (err, users) => {
		    
            if(err) {

                console.log(err);

            } else if(users && users.length > 0) {

                for(let i=0; i < users.length; i++) {
                    
                    let user = users[i];

                    Profile.findOne({ user: user._id }, (err, profile) => {

                        let verifyUrl = APP_BASE_URL+"/#/verify/"+user._id;
                        let link = `<a href="${verifyUrl}">${verifyUrl}</a>`;
                        let emailText = translations[profile.language || "fi"].confirmEmail;
                        emailText = emailText.replace("{link}", link);
                    
                        user.sendVerificationEmail = "false";
                        user.save();
                        
                        console.log("Text to send", profile.language, emailText);
                        this.sendEmail(user.emailAddress, "Email verification request", emailText, emailText);
                    
                    });

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
                    
                    Profile.findOne({ user: user._id }, (err, profile) => {
                        
                        let recoverUrl = APP_BASE_URL+"/#/recover/"+user.pwdRecoveryToken;
                        let link = `<a href="${recoverUrl}">${recoverUrl}</a>`;
                        let emailText = translations[profile.language || "fi"].recoverPassword;
                        emailText = emailText.replace("{link}", link);
                    
                        user.sendRecoveryEmail = "false";
                        user.save();
                    
                        this.sendEmail(user.emailAddress, "Password recovery", emailText, emailText);
                    
                    });

                }

            }
			
		});
			
		
	}
		
	start() {
		
		let expTime = 1000 * 60; // 1 hour
		
		this.expireTimedOutSessions();
		this.sendPendingEmails();
		
        setInterval(() => { this.sendPendingEmails() }, 60000);
        setInterval(() => { this.expireTimedOutSessions() }, expTime);
		
	}	
    
    initRoutes() {
        let loginServiceRoutes = require("./loginServiceRoutes");
        loginServiceRoutes.init(this.app);
    }

}

module.exports = (app) => {
    return new LoginService(app);
};
