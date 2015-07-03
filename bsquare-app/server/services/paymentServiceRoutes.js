module.exports = {
    
    init: (app) => {
		
        app.get('/api/invoices/checkout/:orderId', (req, res) => {
			app.paymentService.checkoutRequest(req.params.orderId)
            .then((response) => {
				res.json(response);
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
