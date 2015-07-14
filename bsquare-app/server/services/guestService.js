import Q from "q";
import url from "url";

let Order, User, Profile, Message;

class GuestService {

    constructor(app) {

        ({ Order, User, Profile, Message } = app.model); 
        this.app = app;

    }

	getGuests(eventId, query) {
		
		let deferred = Q.defer();
			
		let response = { success: 0 };
		
		Order.findQ({ event: eventId })
        .then((orders) => {
				
            let userQueries = orders.filter((order) => {
				return order.user;
            }).map((order) => {
				return User.findOneQ({ _id: order.user });	
			});
			
			let usersById = {};
			
			Q.all(userQueries)
            .then((users) => {
				//console.log("users", users);
                return Q.all(users.map((user) => {
                    return Profile.findOneQ({ user: user._id }).then((profile) => { 
						return { 
							userId: user._id.toHexString(),
							displayName: profile.displayName, 
							userEmail: user.emailAddress
						};
					});
				}));
			})
            .then((users) => {

                users.forEach(user => {
					usersById[user.userId] = user;	
                });
			
				let guests = [];
				let userIds = [];
				let guestsByEmail = {};
				
				for(let i=0; i < orders.length; i++) {
					
					let order = orders[i];
					
					console.log(order.signupFields, order.signupFields.length);
					
					for(let j=0; j < order.signupFields.length; j++) {
						
						console.log(order.signupFields[j].type.name, order.signupFields[j].value);
						if(order.signupFields[j].type.name == "email") {
							
							let email = order.signupFields[j].value;
							if(!guestsByEmail[email]) {
								let guest = { orderEmail: email, numOrders: 0 };
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
				
				let orderEmails = Object.keys(guestsByEmail);
				for(let i=0; i < orderEmails.length; i++) {
					guests.push(guestsByEmail[orderEmails[i]]);
				}
				
				if(query) {
					query = query.toLowerCase();
					let filteredGuests = [];
					for(let i=0; i < guests.length; i++) {
						if(guests[i].orderEmail.toLowerCase().indexOf(query) != -1 ||
						(guests[i].user && guests[i].user.displayName.toLowerCase().indexOf(query) != -1)) {
							filteredGuests.push(guests[i]);
						}
					}
					guests = filteredGuests;
				}
				
				response.guests = guests;
				response.success = 1;
				response.status = "guestsRetrieved";
				deferred.resolve(response);
				
			});
			
		})
        .catch((error) => {
			response.status = "guestRetrievalFailed";
			response.error = error.message;
			deferred.resolve(response);
		})
		.done();
	
			
		return deferred.promise;
		
	}
	
	getMessages(eventId, query) {
		
		let deferred = Q.defer();
		
		let response = { success: 0 };
		
		Message.findQ({ eventId: eventId })
        .then((messages) => {
			
			response.success = 1;
			response.status = "messagesRetrieved";
			response.messages = messages;
			deferred.resolve(response);
			
		});
		
		return deferred.promise;
			
	}
	
	sendMessage(message) {
		
		let deferred = Q.defer();
		
        let emailContent = 
            message.text +
    		"<br><br>"+
    		"B SQUARED";
    
        let email = {
            to: `event-${message.eventId}@bsq.co`,
            bcc: [],
    	    subject: message.subject,
    	    text: emailContent,
    	    html: emailContent
        };

    	for(let i=0; i < message.to.length; i++) {
            email.bcc.push(message.to[i]);
        }

        Object.assign(message, {
            type: "email",
		    from: email.from,
		    html: email.html
        });
	    
        this.app.mailer.sendMail(email, (err, response) => { 
            
            console.log("Mailer response", err, response);
            if(err) { return deferred.reject(err); }
		  		
            message = new Message(Object.assign(message, {
                status: "sent",
		        time: (new Date()).getTime()
            }));

            message.saveQ()
            .then((message) => {
                deferred.resolve();
            })
            .catch((err) => {
                deferred.reject(err);
            });

			
		});
		
		return deferred.promise;
		
	}

    initRoutes() {
        let guestServiceRoutes = require("./guestServiceRoutes");
        guestServiceRoutes.init(this.app);
    }
	
}

module.exports = (app) => {
    return new GuestService(app);
};
