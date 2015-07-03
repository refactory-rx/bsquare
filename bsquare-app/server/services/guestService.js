var Q = require('q');
var url = require('url');

module.exports = function(app) {
    
    let { Order, User, Profile, Message } = app.model;

    var sendgrid = require('sendgrid')(app.settings.SENDGRID_USERNAME, app.settings.SENDGRID_PASSWORD);
    var module = {};

    module.exports = {

	getGuests: function(eventId, query) {
		
		var deferred = Q.defer();
			
		var response = { success: 0 };
		
		Order.findQ({ event: eventId })
		.then(function(orders) {
				
			var userQueries = orders.filter(function(order) {
				return order.user;
			}).map(function(order) {
				return User.findOneQ({ _id: order.user });	
			});
			
			var usersById = {};
			
			Q.all(userQueries)
			.then(function(users) {
				//console.log('users', users);
				return Q.all(users.map(function(user) {
					return Profile.findOneQ({ user: user._id }).then(function(profile) { 
						return { 
							userId: user._id.toHexString(),
							displayName: profile.displayName, 
							userEmail: user.emailAddress
						};
					});
				}));
			})
			.then(function(users) {
				
				for(var i=0; i<users.length; i++) {
					usersById[users[i].userId] = users[i];	
				}
			
				var guests = [];
				var userIds = [];
				var guestsByEmail = {};
				
				for(var i=0; i<orders.length; i++) {
					
					var order = orders[i];
					
					console.log(order.signupFields, order.signupFields.length);
					
					for(var j=0; j<order.signupFields.length; j++) {
						
						console.log(order.signupFields[j].type.name, order.signupFields[j].value);
						if(order.signupFields[j].type.name == 'email') {
							
							var email = order.signupFields[j].value;
							if(!guestsByEmail[email]) {
								var guest = { orderEmail: email, numOrders: 0 };
								if(order.user) {
									guest.user = usersById[order.user.toHexString()];
								}
								guestsByEmail[email] = guest;
							}
							
							guestsByEmail[email].numOrders++;
							break;
							
						}
						
					}
					
					
				}
				
				var orderEmails = Object.getOwnPropertyNames(guestsByEmail);
				for(var i=0; i<orderEmails.length; i++) {
					guests.push(guestsByEmail[orderEmails[i]]);
				}
				
				if(query) {
					query = query.toLowerCase();
					var filteredGuests = [];
					for(var i=0; i<guests.length; i++) {
						if(guests[i].orderEmail.toLowerCase().indexOf(query) != -1 ||
						(guests[i].user && guests[i].user.displayName.toLowerCase().indexOf(query) != -1)) {
							filteredGuests.push(guests[i]);
						}
					}
					guests = filteredGuests;
				}
				
				response.guests = guests;
				response.success = 1;
				response.status = 'guestsRetrieved';
				deferred.resolve(response);
				
			});
			
		})
		.catch(function(error) {
			response.status = 'guestRetrievalFailed';
			response.error = error.message;
			deferred.resolve(response);
		})
		.done();
	
			
		return deferred.promise;
		
	},
	
	
	getMessages: function(eventId, query) {
		
		var deferred = Q.defer();
		
		var response = { success: 0 };
		
		Message.findQ({ eventId: eventId })
		.then(function(messages) {
			
			response.success = 1;
			response.status = 'messagesRetrieved';
			response.messages = messages;
			deferred.resolve(response);
			
		});
		
		return deferred.promise;
			
	},
	
	sendMessage: function(message) {
		
		var deferred = Q.defer();
		
		var emailContent = message.text+'<br><br>';
        
    	emailContent += 
    		'<br><br>'+
    		'B SQUARED';
    		
    	var email = new sendgrid.Email();
    	email.from = SENDGRID_FROM;
    	email.subject = message.subject;
    	email.text = emailContent;
    	email.html = emailContent;
    	
    	for(var i=0; i<message.to.length; i++) {
    		email.addTo(message.to[i]);	
    	}
		
		message.type = 'email';
		message.from = email.from;
		message.html = email.html;
		
		var response = { success: 0 };
		
		sendgrid.send(email, function(err, json) { 
			
			if(err) { 
				console.error(err);
				response.error = err;
				response.status = 'sendgridError';
				deferred.resolve(response);
			} else {
		  		
		  		console.log(json);
		  		response.success = 1;
		  		response.status = 'messageSent';
		  		
		  		message.status = 'sent';
		  		message.time = (new Date()).getTime();
		  		
		  		Message.create(message, function(error, createdMessage) {
		  			if(err) {
		  				console.log(err);
		  			} else {
		  				console.log('saved message');
		  			}
		  		});
		  		
		  		deferred.resolve(response);
		  		
			}
			
		});
		
		return deferred.promise;
		
	},
	
	initRoutes: function() {
		
		app.get('/api/events/:id/guests', function(req, res) {
			
			var eventId = req.params.id;
			
			app.authService.screenRequest(req, true, function(result) {
				
				var url_parts = url.parse(req.url, true);
				var params = url_parts.query;
				
				if(params.q) {
					module.exports.getGuests(eventId, params.q)
					.then(function(response) {
						res.json(response);
					});
				} else {
					module.exports.getGuests(eventId)
					.then(function(response) {
						res.json(response);
					});	
				}
				
				
			});
			
		});
		
		
		app.post('/api/events/:id/messages', function(req, res) {
			
			var message = req.body;
			
			app.authService.screenRequest(req, true, function(result) {
				
				module.exports.sendMessage(message)
				.then(function(response) {
					res.json(response);
				});
				
			});
			
		});
		
		app.get('/api/events/:id/messages', function(req, res) {
			
			app.authService.screenRequest(req, true, function(result) {
					
				module.exports.getMessages(req.params.id)
				.then(function(response) {
					res.json(response);
				});
			
			});
			
		});
		
	}
	
    };

    return module.exports;

};
