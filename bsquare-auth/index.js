import passwordHash from "password-hash";
import crypto from "crypto";

let User, Profile;

class AuthService {

    constructor(app) {
        
        ({ User, Profile } = app.model);
        
        this.captchaEnabled = true;
	    this.askVerification = true;
	    this.requireVerification = false;
    
    }
	
	logregUser(user, callback) {
		
		let response = {
			success: 0,
			status: 'none'
		};
		
        User.findOne( { emailAddress: user.emailAddress }, (err, savedUser) => {
			
			if(err) {
				
				response.status = 'error';
				response.message = 'Could not get user data.';
				response.error = err;
				callback(response);
				
			} else {
				
				if(savedUser) {
					
					response.status = 'exists';
					
					let verified = passwordHash.verify(user.password, savedUser.password);
					
					if(verified) {
						
						response.status = 'pwdMatch';
						
                        crypto.randomBytes(48, (ex, buf) => {
							
							if(ex) {
								
								response.status = 'tokenGenError';
								response.message = 'Failed to generate a token.';
								response.error = ex;
								callback(response);
								return;
								
							} else {
								
								let token = buf.toString('hex');
								let loggedUser = {
									id: savedUser._id,
									emailAddress: user.emailAddress,
									token: token
								};
								
                                let updateQuery = { _id: savedUser._id };
                                let tokens = savedUser.tokens;
                                if(!tokens) {
                                    tokens = {};
                                }
                                tokens[token] = savedUser.emailAddress;
								let updateFields = {
									loginStatus: 'loggedIn',
									lastActiveTime: (new Date()).getTime(),
									tokens: tokens
								};
								
                                User.update(updateQuery, updateFields, (updateUserErr, numAffected) => {
									
									if(updateUserErr) {
										
										response.status = 'updateUserError';
										response.message = 'Failed to save log-in data.';
										response.error = updateUserErr;
										callback(response);
										
									} else {
										
										let loggedUser = {
                                            token: token,
                                            email: savedUser.emailAddress,
                                            loginStatus: 'loggedIn',
                                            emailVerified: savedUser.emailVerified
										};
										
										response.success = 1;
										response.status = 'loggedIn';
										response.message = 'Logged in.';
										
                                        Profile.findOne( { user: savedUser._id }, (profileErr, profile) => {
											
											if (profile) {
											    loggedUser.displayName = profile.displayName;
                                            }

											response.user = loggedUser;
											callback(response);
											
										});
										
									}
									
									
								});
								
								
							}
							
                        });
						
					} else {
						
						response.success = 0;
						response.status = 'pwdWrong';
						response.message = 'Wrong e-mail or password.';
						callback(response);
					
					}
					
				} else {
					
					response.success = 1;
					response.status = 'new';
					callback(response);
					
				}
				
				
			}
			
			
		});
		
	}
	
	logout(req, callback) {
		
		let response = {
			success: 0,
			status: 'none'
		};
		
		let token = req.headers['session-token'];
		let emailAddress = req.headers['bsquare-user'];
		
		if(token === undefined || token === '') {
			callback(response);
			return;
		}

        this.screenRequest(req, true, (result) => { 
            User.findOne({ emailAddress: emailAddress }, (err, user) => {
                if(err) {
                    response.status = 'error';
                    response.error = err;
                    callback(response);
                } else {
                    if(user) {
                        this.logoutUser(user, token, callback);
                    } else {
                        response.status = 'notfound';
                        callback(response);
                    }
                }
            });
        });

	}
	
	logoutUser(user, token, callback) {
		
		let response = {
			success: 0,
			status: 'none'
		};
		
		let query = { emailAddress: user.emailAddress };
        let update = { loginStatus: 'loggedOut', token: '' };

        User.findOne(query, (err, foundUser) => {
			
			if(err) {	
				response.status = 'error';
                response.error = err;
                return response;
            } else {
                
                let tokens = foundUser.tokens;
                delete tokens[token]; 

                let updatedTokens = {};
                let tokenKeys = Object.getOwnPropertyNames(tokens);
                tokenKeys.forEach((tokenKey) => {
                    updatedTokens[tokenKey] = tokens[tokenKey];
                });

                foundUser.tokens = updatedTokens;
                foundUser.loginStatus = 'loggedOut';
                User.update({ _id: foundUser._id }, { loginStatus: 'loggedOut', tokens: updatedTokens }, function(err, numUpdated) {
                });

				response.success = 1;
				response.status = 'loggedOut';
			}
			
			if(callback) {
				callback(response);
			}
			
			
		});
		
	}
	
	registerUser(registration, callback) {
		
		let response = {
			success: 0,
			status: 'none'
		};
		
		let user = registration.user;
		let hashedPassword = passwordHash.generate(user.password);
		let unhashedPassword = user.password;
		user.password = hashedPassword;
		user.emailVerified = 'false';
		
		if(this.askVerification === true) {
			user.sendVerificationEmail = 'true';
		}
		
        User.create(user, (userErr, savedUser) => {
			
			if(userErr) {
				
				response.status = 'error';
				response.error = userErr;
				
			} else {
				
				response.success = 1;
				response.status = 'registered';
				
				let profile = registration.profile;
				
				if(profile) {
					
					profile.user = savedUser._id;
					
                    Profile.create(profile, (profileErr, savedProfile) => {
						
						if(profileErr) {
							response.profileStatus = 'error';
							response.profileError = profileErr;
						} else {
							response.profileStatus = 'created';
						}
						
						if(registration.loginImmediately == 'true') {
							user.password = unhashedPassword;
							this.logregUser(user, callback);
						} else {
							callback(response);
						}
						
						
					});
				
				} else {
					
					if(registration.loginImmediately == 'true') {
						user.password = unhashedPassword;
						this.logregUser(user, callback);
					} else {
						callback(response);
					}
					
				}
				
			}
			
			
		});
			
	}
	
	verifyUser(userId, callback) {
		
		let response = {
			success: 0,
			status: 'none'
		};
		
		let objId = mongoose.Types.ObjectId(userId);
		
        User.findByIdAndUpdate(objId, { emailVerified: 'true' }, (err, user) => {
			
			if(err) {
				
				response.status = 'error';
				response.message = 'Error accessing user data.';
				response.error = err;
				//console.log(err);
				
			} else {
				
				if(user) {
					response.success = 1;
					response.status = 'emailVerified';
					response.message = 'Email verified.';
				} else {
					response.status = 'userNotFound';
					response.message = 'Could not find user.';
				}
			
			}
			
			callback(response);
						
		});
		
	}
	
	recoverPassword(recoveryRequest, callback) {
		
		let response = {
			success: 0,
			status: 'none'
		};
		
		let emailAddress = recoveryRequest.emailAddress;
		
        User.findOne( { emailAddress: emailAddress }, (err, user) => {
			
			if(err) {
				
				response.status = 'error';
				response.message = 'Failed to get user data.';
				response.error = err;
				callback(response);
				
			} else {
				
				if(user) {
					
					response.status = 'userFound';
					
                    crypto.randomBytes(48, (ex, buf) => {
						
						if(ex) {
							
							response.status = 'tokenGenError';
							response.message = 'Failed to generate recovery token.';
							response.error = ex;
							callback(response);
							
						} else {
							
							let token = buf.toString('hex');
							
                            User.update( { _id: user._id }, { pwdRecoveryToken: token, sendRecoveryEmail: 'true' }, (tokenSaveErr, numAffected) => {
								
								if(tokenSaveErr) {
									response.status = 'tokenSaveError';
									response.message = 'Failed to save recovery token.';
									response.error = tokenSaveErr;
								} else {
									response.success = 1;
									response.status = 'emailSent';
									response.message = 'Password reset process initiated.';
									response.error = tokenSaveErr;
								}
								
								callback(response);
								
							});
							
						}
						
					});
				
				} else {
					
					response.status = 'userNotFound';
					response.message = 'No such user ('+emailAddress+')';
					callback(response);
					
				}
				
			}
			
			
		});
		
		
	}
	
	changePassword(changeRequest, callback) {
		
		let response = {
			success: 0,
			status: 'none'
		};
		
		let recoveryToken = changeRequest.recoveryToken;
		
		if(recoveryToken === undefined || recoveryToken === '') {
			response.status = 'invalidToken';
			response.message = 'Invalid recovery token.';
			callback(response);
			return;
		}
		
        User.findOne( { pwdRecoveryToken: recoveryToken }, (err, user) => {
			
			if(err) {
				
				response.status = 'error';
				response.message = 'Failed to get user data.';
				response.error = err;
				callback(response);
				
			} else {
				
				if(user) {
					
					response.status = 'userFound';
					
					let hashedPassword = passwordHash.generate(changeRequest.password);
						
                    User.update( { _id: user._id }, { password: hashedPassword, pwdRecoveryToken: '' }, (pwdSaveErr, numAffected) => {
							
						if(pwdSaveErr) {
								
							response.status = 'pwdSaveError';
							response.message = 'Failed to save new password.';
							response.error = pwdSaveErr;
							
						} else {
								
							response.success = 1;
							response.status = 'pwdChanged';
							response.message = 'Password changed successfully.';
							
						}
						
						callback(response);
							
					});
						
				} else {
					
					response.status = 'invalidToken';
					response.message = 'Invalid recovery token.';
					callback(response);
					
				}
				
			}
			
			
		});
		
	}
		
	screenRequest(req, updateTime, callback) {

		let response = {
			status: 'unauthorized'
		};
		
		let token = req.headers['session-token'];
		let emailAddress = req.headers['bsquare-user'];
	    	
		if(token === undefined || token === '') {
			callback(response);
			return;
		}
	    
        User.findOne( { emailAddress: emailAddress }, (err, user) => {
			 
            if(user) {
                if(!user.tokens[token]) {
                    callback(response);
                    return;
                }

				response.status = 'authorized';
				response.user = {
					id: user._id,
					email: user.emailAddress,
					tokens: user.tokens,
                    loginStatus: user.loginStatus,
                    emailVerified: user.emailVerified
				};
				
				if(this.requireVerification === true) {
					if(user.emailVerified != 'true') {
						response.status = 'unverified';
					}
				}
				
                Profile.findOne( { user: user._id }, (profileErr, profile) => {
					
					if(profile) {
						response.profile = profile;
					}
					
					callback(response);
					
				});
				
				if(updateTime === true) {
					
					let now = (new Date()).getTime();
					User.update( { _id: user._id }, { lastActiveTime: now });
					
				}
				
			} else {
				
				callback(response);
				
			}
			
		});
		
	}
	
}

module.exports = (app) => {
    return new AuthService(app);
};
