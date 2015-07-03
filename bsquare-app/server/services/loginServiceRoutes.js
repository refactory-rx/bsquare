module.exports = {

    init: (app) => {
		
        app.post('/api/login', (req, res) => {
		
			let user = req.body;
			
            app.authService.logregUser(user, (response) => {
				res.json(response);
			});
			
		});
		
        app.get('/api/logout', (req, res) => {
			
            app.authService.logout(req, (result) => {
				res.json(result);
			});
			
		});
		
        app.get('/api/profile', (req, res) => {
			
            app.loginService.getProfile(req, (result) => {
				res.json(result);
			});
			
		});
		
        app.post('/api/profile', (req, res) => {
			
            app.loginService.saveProfile(req, (result) => {
				res.json(result);
			});
			
		});
		
        app.post('/api/register', (req, res) => {
			
			let registration = req.body;
			
            app.authService.registerUser(registration, (response) => {
				res.json(response);
			});
			
		});
		
		
		app.post('/api/recover', function(req, res) {
			
			let recoveryRequest = req.body;
			
            app.authService.recoverPassword(recoveryRequest, (response) => {
				res.json(response);
			});
			
		});
		
		
		app.post('/api/password', function(req, res) {
			
			let changeRequest = req.body;
			
            app.authService.changePassword(changeRequest, (response) => {
				res.json(response);
			});
			
		});
		
		
        app.get('/api', (req, res) => {
			
            app.authService.screenRequest(req, false, (result) => {
				
				if(result.status == 'app.authService.rized' && result.profile) {
					
					let profile = result.profile;
					let username = null;
					
					if(profile.displayName) {
						username = profile.displayName;
					} else {
						
						if(profile.firstName || profile.lastName) {
							
							username = '';
							
							if(profile.firstName) {
								username += profile.firstName;
							}
							
							if(profile.lastName) {
								if(profile.firstName) {
									username += ' ';
								}
								username += profile.firstName;
							}
							
						}
						
					}
					
					result.user.username = username;
					
					delete result.profile;
					
				}
				
				res.json(result);
				
			});
			
		});
		
        app.get('/api/verify/:id', (req, res) => {
			
			let userId = req.params.id;
			
            app.authService.verifyUser(userId, (response) => {
				res.json(response);
			});
			
		});
	
			
    }

};
