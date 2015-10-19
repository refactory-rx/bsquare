"use strict";

import log4js from "log4js";
let log = log4js.getLogger("PhantomService");

import Q from "q";
import request from "request";
import fs from "fs";
import url from "url";
import moment from "moment";
import phantom from "phantom";

let WEB_CONTENT_PATH, TICKET_SERVICE_URL;

class PhantomService {

    constructor(app) {
        ({ WEB_CONTENT_PATH, TICKET_SERVICE_URL } = app.settings);
    }

    createTicket(ticket) {

        let deferred = Q.defer();
        this._createTicketHtml(ticket, (err) => {

            if (err) {
                deferred.reject(err);
                return;
            }

            this._createTicketPdf(ticket)
            .then((ticket) => {
                deferred.resolve(ticket);
            });

        });

        return deferred.promise;

    }

    createTickets(tickets) {

        let deferred = Q.defer();

        let createTicketPromises = tickets.map(ticket => this.createTicket(ticket));

        Q.all(createTicketPromises)
        .then((tickets) => {
            log.debug("done creating tickets", tickets);
            deferred.resolve(tickets);
        })
        .catch((err) => {
            deferred.reject(err);
        });

        return deferred.promise;

    }

    createPage(url) {

        var deferred = Q.defer();

        phantom.create((ph) => {

            log.debug("phantom created");
            ph.createPage((page) => {

                //page.set("paperSize", { format: "A4" });
                log.debug(`web page created, url: ${url}`);
                page.set("onLoadFinished", (success) => {
                    log.debug(`load finished, success: ${success}`);
                });

                page.open(url, (status) => {

                    log.debug(`page load status: ${status}`);
                    page.getContent((result) => {
                        deferred.resolve(result);
                    });

                });

            });

        });

        return deferred.promise;

    }

    _createTicketHtml(ticket, callback) {

        let time = moment(ticket.startTime, "x").format("YYYY/MM/DD hh:mm");

        let ticketHtml =

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

        let writeStream = fs.createWriteStream(`${WEB_CONTENT_PATH}/tickets/qr${ticket._id}.png`);

        writeStream.on("finish", () => {

            let path = `${WEB_CONTENT_PATH}/tickets/ticket${ticket._id}.html`;
            fs.writeFile(path, ticketHtml, (err) => {
                callback(err);
            });

        });

        request(`https://blockchain.info/qr?data=http%3A%2F%2Fbsq.co%2F%23%2Fticket%2F${ticket._id}&size=200`).pipe(writeStream);

    }

    _createTicketPdf(ticket) {

        var deferred = Q.defer();

        phantom.create((ph) => {

            log.debug("phantom created");
            ph.createPage((page) => {

                page.set("paperSize", { format: "A4" });

                var ticketUrl = `${TICKET_SERVICE_URL}/tickets/ticket${ticket._id}.html`;
                log.debug(`ticket page created, url: ${ticketUrl}`);

                page.open(ticketUrl, (status) => {

                    log.debug(`ticket load status: ${status}`);
                    var path = `${WEB_CONTENT_PATH}/tickets/ticket${ticket._id}.pdf`;
                    var url = `${TICKET_SERVICE_URL}/tickets/ticket${ticket._id}.pdf`;

                    page.render(path, () => {
                        fs.readFile(path, (err, data) => {
                            log.debug(err, url);
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

}

module.exports = (app) => {
    return new PhantomService(app);
};
