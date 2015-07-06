module.exports = {
    
    init: (app) => {
		
        app.get("/api/stats/:eventId/:statType", (req, res) => {
		    
            app.authService.screenRequest(req, true, (authResult) => {
	            
	            if(authResult.status === "authorized") {
	            	
	            	let statType = req.params.statType;
	                app.statsService.getEventStats(req.params.eventId, statType)
                    .then((response) => {
	                	if(statType === "revenue") {
	                		res.end(response);	
	                	} else {
	                		res.json(response);
	                	}
	                	
	                });
	                
	            } else {
	                res.json(authResult);
	            }
	            
            });

		});
		
    }


};
