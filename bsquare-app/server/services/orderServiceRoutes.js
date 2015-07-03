module.exports = {

    init: (app) => {

        app.get('/api/orders/:id', (req, res) => {
            app.orderService.getOrder(req, (result) => {
				res.json(result);
			});
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

        app.post('/api/orders', (req, res) => {
            app.orderService.saveOrder(req, (result) => {
				res.json(result);
			});
		});

    }

};
