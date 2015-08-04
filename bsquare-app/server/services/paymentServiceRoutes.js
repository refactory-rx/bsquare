module.exports = {

    init: (app) => {

        app.get('/api/invoices/checkout/:orderId', (req, res, next) => {

            app.paymentService.checkoutRequest(req.params.orderId)
            .then((invoice) => {
                if (invoice) {
				    res.json({ status: "ok", invoice: invoice });
                } else {
                    res.json({ status: "ok", message: "free_order" });
                }
            })
            .catch((err) => {
                next(err);
            });

		});

        app.get('/api/invoices/:id', (req, res) => {
            app.paymentService.getInvoice(req, (result) => {
				res.json(result);
			});
		});

        app.post('/api/invoices', (req, res) => {
            app.paymentService.createInvoice(req, (result) => {
				res.json(result);
			});
		});

        app.put('/api/invoices', (req, res) => {
            app.paymentService.modifyInvoices(req, (result) => {
				res.json(result);
			});
		});

	}

};
