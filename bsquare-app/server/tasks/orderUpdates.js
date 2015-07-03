var Q = require('q');

var paymentTime = 30*60*1000;

module.exports = function(app) {

    let { Order, Invoice, TicketResource } = app.model;

    var module = {};
    
    module.exports = {

    timeoutOrders: function() {

        var now = (new Date()).getTime();
        var tooOld = now - paymentTime;

        console.log('timeout orders older than '+tooOld);

        var qtyByResource = {};
        var timedoutOrderIds = [];

        Order.findQ({
            $and: [
                { timePlaced: { $lt: tooOld } },
                { status: { $nin: ['fulfilled', 'refunded', 'paid', 'timedout'] } }
            ]
        })
        .then(function(orders) {

            for(var i=0; i < orders.length; i++) {

                timedoutOrderIds.push(orders[i]._id);

                for(var j=0; j < orders[i].items.length; j++) {

                    var item = orders[i].items[j];
                    if(!qtyByResource[item.ticketResource]) {
                        qtyByResource[item.ticketResource] = 0;
                    }

                    qtyByResource[item.ticketResource] += parseInt(item.quantity);

                }

            }

            var resourceIds = Object.getOwnPropertyNames(qtyByResource);
            //console.log(resourceIds);
            return TicketResource.findQ({ _id: { $in: resourceIds } });

        })
        .then(function(ticketResources) {

            //console.log(ticketResources);

            var resourceUpdates = ticketResources.map(function(ticketResource) {
                var quantity = qtyByResource[ticketResource._id.toHexString()];
                var qtyReserved = ticketResource.qtyReserved - quantity;
                console.log(ticketResource.name+': qtyReserved - '+quantity+' = '+qtyReserved);
                return TicketResource.updateQ({ _id: ticketResource._id }, { qtyReserved: qtyReserved });
            });

            return Q.all(resourceUpdates);

        })
        .then(function(rowsAffected) {

            console.log(rowsAffected);

            console.log(timedoutOrderIds);
            return Order.updateQ( { _id: { $in: timedoutOrderIds } }, { status: 'timedout' }, { multi: true });

        })
        .then(function(rowsAffected) {
            console.log('Timed out orders: '+rowsAffected);
        })
        .catch(function(error) {
            console.log(error);
        })
        .done();

    },


    updatePaymentStatus: function() {

        Order.findQ({ status: "invoiced" })
        .then(function(orders) {

            console.log(`updating payment status for ${orders.length} orders`, orders);

            orders.forEach(order => {
                if(order.paymentStatus === "paid") {
                    app.orderService.fulfillOrder(order._id, (result) => {
                        console.log("order fulfilled in order update task");
                    });
                } else {
                    if(order.invoiceId) {
                        module.exports.updateOrderPaymentStatus(order);
                    }
                }
            });

        })
        .catch(function(error) {
            console.log(error);
        });

    },


    updateOrderPaymentStatus: function(order) {

        Invoice.findOneQ({ _id: order.invoiceId })
        .then(function(invoice) {

            console.log('foundInvoice', invoice);

            app.paymentService.updateInvoice(invoice, function(response) {
                console.log('scheduled invoice update response', response);
            });

        })
        .catch(function(error) {
            console.log(error);
        });

    },

    start: function() {

        module.exports.timeoutOrders();
        module.exports.updatePaymentStatus();

        setInterval(module.exports.timeoutOrders, 60*1000);
        setInterval(module.exports.updatePaymentStatus, 60*1000);

    }

    };

    return module.exports;

};
