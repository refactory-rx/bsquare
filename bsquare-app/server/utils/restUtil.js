var mongoose = require('mongoose');

module.exports = {
	
	getOne: function(Model, req, res) {
			
		var response = {
			success: 0
		};
				
		var objId = mongoose.Types.ObjectId(req.params.id);
		        
		Model.findById(objId, function(err, event) {
		             
			if(err) {

				response.data = err;
				//console.log(err);

			} else {

				response.data = event;
				response.success = 1;

			}
					
		});

	},

	getMany: function(Model, req, res) {
			
		var response = {
			success: 0
		};

		var url_parts = url.parse(req.url, true);
		var query = url_parts.query;
		
		Model.find(query, function(err, objects) {

			if(err) {
				response.data = err;
				//console.log(err);
			} else {
				response.data = objects;
				response.success = 1;
			}

			res.json(response);

		});

	},
	
	
	put: function(Model, req, res) {
		
	},
	
	
	post: function(Model, req, res) {
		
		var result = {
			success: 0
		};

		var objId = mongoose.Types.ObjectId(req.params.id);

		var updateFields = req.body;

		Model.update({ _id: objId }, updateFields, function(err, numAffected) {

			if(err) {
				//console.log(err);
				result.data = err;
			} else {
				result.success = 1;
				result.data = numAffected;
			}
			
			res.json(result);

		});
		
	},
	
	
	delete: function(Model, req, res) {
	
		var response = {
			success: 0
		};

		var objId = mongoose.Types.ObjectId(req.params.id);
		
		Event.remove({ _id : objId }, function(err, order) {
			
			if(err) {
				res.send(err);
				response.data = err;
			} else {
				response.success = 1;
			}

			res.json(response);

		});

	}
	
};