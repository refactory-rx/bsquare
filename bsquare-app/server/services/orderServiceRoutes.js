module.exports = {

  init: (app) => {

    app.get('/api/orders/:id', (req, res) => {
      app.orderService.getOrder(req, req.params.id)
      .then(response => {
        if (req.auth && req.auth.user) {
          app.trackerService.getAvailableRefRewards(req.auth.user)
          .then(result => {
            response.availableReward = result;
            res.json(response);
          })
          .catch(err => {
            res.json(response);
          });
        } else {
          res.json(response);
        }
      })
      .catch(response => res.json(response));
    });

    app.post('/api/orders/:id', (req, res) => {
			console.log(req.body);
			res.json({ status: 'ok' });
		});

    app.get('/api/orders', (req, res) => {
      app.orderService.getOrders(req, (result) => {
				res.json(result);
			});
		});

    app.post("/api/orders", (req, res, next) => {

      const order = req.body.order;
      const user = req.auth  ? req.auth.user : null; 
      const language = req.headers["bsquare-language"];
      app.orderService.saveOrder(order, user, language)
      .then(order => {
				res.json({ status: "ok", order });
      })
      .catch(err => next(err));
    
    });

  }

};
