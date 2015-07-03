module.exports = (db) => {
    
    return {
        Event: require('./models/event')(db),
        Ticket: require('./models/ticket')(db),
        TicketResource: require('./models/ticketResource')(db),
        Order: require('./models/order')(db),
        Profile: require('./models/profile')(db),
        User: require('./models/user')(db),
        RefTracker: require('./models/refTracker')(db),
        ImpressionTracker: require('./models/impressionTracker')(db),
        OrdersByTicketResource: require('./models/ordersByTicketResource')(db),
        Invoice: require('./models/invoice')(db),
        Message: require('./models/message')(db)
    }


};
