module.exports = {
    
    init: (app) => {
		
        app.get("/api/refstats", (req, res) => {
			
            app.trackerService.getRefStats(req, (response) => {
				res.json(response);
			});
			
		});
		
        app.get("/api/reftrackers", (req, res, next) => {
            
            app.trackerService.getRefTracker(req.query)
            .then((refTracker) => {
                res.json({ status: "ok", refTracker: refTracker });
            })
            .catch((err) => {
                next(err);
            });

        });
        
        app.get("/api/reftrackers/:uuid/rewardstats", (req, res, next) => {
            
            app.trackerService.getRewardStatsByTracker(req.params.uuid)
            .then((rewardStats) => {
                res.json({ status: "ok", rewardStats: rewardStats });
            })
            .catch((err) => {
                next(err);
            });

        });

        app.post("/api/reftrackers", (req, res) => {
			
            app.trackerService.getRefTrackers(req, (result) => {
				
				//console.log(result);
				
				if(result.success == 1) {
					
					if(result.status == 'zeroRefTrackersFound' || result.status == 'trackersNotFound') {
						
                        app.trackerService.saveRefTracker(req, (result) => {
							res.json(result);
						});
					
					} else if(result.refTrackers.length == 1) {
						
						if(result.status == 'refTrackersFound') {
							result.status = 'refTrackerExisted';
							result.message = 'refTracker existed.';
							result.refTracker = result.refTrackers[0];
						}
						
						res.json(result);
						
					} else {
						
						res.json(result);
						
					}
					
				} else {
					
					res.json(result);
					
				}
				
			});
			
		});
		
    }

};
