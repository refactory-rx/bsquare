var Q = require('q');

var request = require('request');
var fs = require('fs');
var url = require('url');
var moment = require('moment');
var phantom = require('phantom');

let WEB_CONTENT_PATH, TICKET_SERVICE_URL;

class PhantomService {

    constructor(app) {
        ({ WEB_CONTENT_PATH, TICKET_SERVICE_URL } = app.settings);
    }

    createTicketHtml(ticket, callback) {

        var time = moment(ticket.startTime, "x").format("YYYY/MM/DD hh:mm");

        var ticketHtml =
            
        `<html>
            <head>
            <title>Ticket ${ticket._id}</title>
            </head>
            <body>
            <div>Ticket ID: ${ticket._id}</div>
            <div style="width: 100%;">
                <div style="display: inline-block; width: 50%;">
                <img src="/tickets/qr${ticket._id}.png">
                </div>
                <div style="display: inline-block; vertical-align: top; padding-top: 10px; padding-right: 20px;">
                ${ticket.eventName}<br>
                ${time}<br><br>
                <b>${ticket.ticketName}</b> / ${ticket.price} EUR<br>
                </div>
            </div>
            </body>
        </html>`;

        var writeStream = fs.createWriteStream(`${WEB_CONTENT_PATH}/tickets/qr${ticket._id}.png`);

        writeStream.on("finish", () => {

            console.log("Finished writing file!");
            var path = `${WEB_CONTENT_PATH}/tickets/ticket${ticket._id}.html`;
            fs.writeFile(path, ticketHtml, (err) => {
                callback(err);
            });

        });

        request(`https://blockchain.info/qr?data=http%3A%2F%2Fbsq.co%2F%23%2Fticket%2F${ticket._id}&size=200`).pipe(writeStream);
         
    }

    createTicketPdf(ticket) {

	    var deferred = Q.defer();
        
        phantom.create((ph) => {

            console.log("phantom created");
            ph.createPage((page) => {

                page.set("paperSize", { format: "A4" });
                
                //let ticketUrl = `file://${WEB_CONTENT_PATH}/tickets/ticket${ticket._id}.html`; 
                var ticketUrl = `${TICKET_SERVICE_URL}/tickets/ticket${ticket._id}.html`;
                console.log(`ticket page created, url: ${ticketUrl}`);

                page.open(ticketUrl, (status) => {

                    console.log(`ticket load status: ${status}`);
                    var path = `${WEB_CONTENT_PATH}/tickets/ticket${ticket._id}.pdf`;
                    var url = `${TICKET_SERVICE_URL}/tickets/ticket${ticket._id}.pdf`;

                    page.render(path, () => {

                        fs.readFile(path, (err, data) => {
                            console.log(err, url);
                            deferred.resolve({
                                id: ticket._id, 
                                url: url,
                                path: path,
                                data: data 
                            });
                            ph.exit();
                        });

                    });

                });

            });

        });

	    return deferred.promise;

	}

    createTicket(ticket) {
        
        let deferred = Q.defer();
        this.createTicketHtml(ticket, (err) => {            
            
            if (err) {
                deferred.reject(err);
                return;
            }

            this.createTicketPdf(ticket)
            .then((ticket) => {
                deferred.resolve(ticket);
            });

        });
        
        return deferred.promise;

    }

	createTickets(tickets, callback) {

        let createTicketPromises = [];
        tickets.forEach(ticket => {
            console.log("schedule ticket pdf", ticket);
            createTicketPromises.push(this.createTicket(ticket));
        });
        
        console.log("execute batch ticket creation");
        Q.all(createTicketPromises).then((tickets) => {
            console.log("done creating tickets", tickets);
            callback({ success: 1, status: 'ticketsCreated', tickets: tickets });
        });

	}

}

module.exports = (app) => {
    return new PhantomService(app);
};
