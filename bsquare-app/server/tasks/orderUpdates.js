import Q from "q";

let Order, Invoice, TicketResource;
let paymentTime = 3*60*1000;

class OrdersTask {
    
    constructor(app) {
        ({ Order, Invoice, TicketResource } = app.model);
    }

    timeoutOrders() {

        var now = (new Date()).getTime();
        var tooOld = now - paymentTime;

        console.log(`timeout orders older than ${tooOld}`);

        var qtyByResource = {};
        var timedoutOrderIds = [];

        Order.findQ({
            $and: [
                { timePlaced: { $lt: tooOld } },
                { status: { $nin: ["fulfilled", "refunded", "paid", "timedout"] } }
            ]
        })
        .then((orders) => {

            orders.forEach(order => {

                timedoutOrderIds.push(order._id);

                order.items.forEach(item => {
                    
                    if(!qtyByResource[item.ticketResource]) {
                        qtyByResource[item.ticketResource] = 0;
                    }

                    qtyByResource[item.ticketResource] += parseInt(item.quantity);

                });

            });

            var resourceIds = Object.getOwnPropertyNames(qtyByResource);
            //console.log(resourceIds);
            return TicketResource.findQ({ _id: { $in: resourceIds } });

        })
        .then((ticketResources) => {

            //console.log(ticketResources);

            var resourceUpdates = ticketResources.map((ticketResource) => {
                var quantity = qtyByResource[ticketResource._id.toHexString()];
                var qtyReserved = ticketResource.qtyReserved - quantity;
                console.log(ticketResource.name+': qtyReserved - '+quantity+' = '+qtyReserved);
                return TicketResource.updateQ({ _id: ticketResource._id }, { qtyReserved: qtyReserved });
            });

            return Q.all(resourceUpdates);

        })
        .then((rowsAffected) => {

            console.log(rowsAffected);

            console.log(timedoutOrderIds);
            return Order.updateQ( { _id: { $in: timedoutOrderIds } }, { status: "timedout" }, { multi: true });

        })
        .then((rowsAffected) => {
            console.log(`Timed out orders: ${rowsAffected}`);
        })
        .catch((error) => {
            console.log(error);
        })
        .done();

    }

    updatePaymentStatus() {

        Order.findQ({ status: "invoiced" })
        .then((orders) => {

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
        .catch((error) => {
            console.log(error);
        });

    }

    updateOrderPaymentStatus(order) {

        Invoice.findOneQ({ _id: order.invoiceId })
        .then((invoice) => {

            console.log('foundInvoice', invoice);

            app.paymentService.updateInvoice(invoice, (response) => {
                console.log('scheduled invoice update response', response);
            });

        })
        .catch((error) => {
            console.log(error);
        });

    }

    start() {

        this.timeoutOrders();
        this.updatePaymentStatus();

        setInterval(() => {
            this.timeoutOrders();
        }, 60*1000);

        setInterval(() => {
            this.updatePaymentStatus()
        }, 60*1000);

    }

}

module.exports = (app) => {
    return new OrdersTask(app);
};
