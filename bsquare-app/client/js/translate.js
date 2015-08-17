mainApp.config(($translateProvider) => {
    
    //console.log($locale);
    
    $translateProvider.translations("en", {
                      
        "forms.dataType.email": "E-mail",
        "forms.dataType.confirmEmail": "Confirm e-mail",
        "forms.dataType.name": "Name",
        "forms.dataType.username": "Username",
        "forms.dataType.firstName": "First name",
        "forms.dataType.lastName": "Last name",
        "forms.dataType.phoneNumber": "Phone number",
        "forms.dataType.address": "Address",
        "forms.dataType.customText": "Custom text",
         
        "forms.general.cancel": "Cancel",
        "forms.general.create": "Create",
        "forms.general.save": "Save",
        "forms.general.changed": "Changed",
        "forms.general.saved": "Saved",
        "forms.general.created": "Created",
        "forms.general.edit": "Edit",
        "forms.general.delete": "Delete",
        "forms.general.yes": "Yes",
        "forms.general.no": "No",
        "forms.general.back": "Back",
        
        "app.header.login": "LOG IN",
        "app.header.logout": "LOG OUT",
        
        "app.logreg.title": "Log In / Register",
        "app.logreg.explanation": "Type in your existing or new log-in credentials. A new account will be created if you have not registered yet.",
        "app.logreg.email": "E-mail",
        "app.logreg.password": "Pssword",
        "app.logreg.hidepwd": "Hide password",
        "app.logreg.btn-go": "GO",
        "app.logreg.recoverPwd": "Recover password",
        "app.logreg.regNewUser": "Register new account",
        "app.logreg.register": "Register",
        "app.logreg.thanks": "Thank you for registering. Check your e-mail to verify your e-mail address and proceed to log-in.",
        "app.logreg.loggedIn": "You are logged in.",
        "app.logreg.agreedToTos1": "I have read the",
        "app.logreg.tos": "terms of service",
        "app.logreg.agreedToTos2": "and I agree to them by registering",
        
        "pwdRecovery.explanationText": "Password recovery involves two steps:",
        "pwdRecovery.step1Text": "1) Request recovery link to the address you registered with",
        "pwdRecovery.step2Text": "2) Follow the link you get by e-mail and set a new password", 
        "pwdRecovery.recoverPwd": "Change password",
        "pwdRecovery.pwdChanged": "The password has been changed. You can now",
        "pwdRecovery.login": "log in",
        "pwdRecovery.withNewPwd": "with your new password",
        "pwdRecovery.change": "Change",
        "pwdRecovery.newPwd": "New password",
        "pwdRecovery.mailSent": "Password recovery e-mail was sent to",
        "pwdRecovery.followInstructions": "Follow instructions sent to you by e-mail to change your password.",
        
        "app.findEvents.title": "Find events",
        "app.findEvents.searchFilters": "Search filters",
        "app.findEvents.searchText": "Search by name, type, place...",
        
        "app.myEvents.title": "My events",
        "app.myEvents.add": "Add",
        "app.myEvents.createEvent": "Create event",
        "app.myEvents.noEventsText": "You have not created any events :(",
        "app.myEvents.noEventsNew": "Create one",
        "app.myEvents.sold": "Sold",
        "app.myEvents.reserved": "Reserved",
        "app.myEvents.remains": "Remains",
        
        "app.myTickets.title": "My tickets",
        "app.myTickets.noTicketsText": "You don&#39;t have any tickets :(",
        
        "event.front.manage": "Manage",
        "event.front.tickets.title": "Tickets",
        "event.front.tickets.type": "Ticket type",
        "event.front.tickets.price": "Price",
        "event.front.tickets.quantity": "Quantity",
        "event.front.tickets.total": "Total",
        "event.front.tickets.soldOut": "Sold out",
        "event.front.tickets.noAvailableTickets": "There are no publically available tickets for this event at the moment.",
        "event.front.tickets.addEditTickets": "To add tickets and/or adjust their sales dates and visibility, go to",
        "event.front.tickets.eventManagement": "event management",
       
        "event.front.rewards.groupRewards": "Group Rewards",
        "event.front.rewards.referralRewards": "Referral Rewards",
        "event.front.rewards.shareToGet": "Share to get these rewards",
        "event.front.rewards.logIn": "Log in",
        "event.front.rewards.startSharingGroup": "to start!",
        "event.front.rewards.startSharingRef": "to start!",
        "event.front.rewards.pointsRequired": "points required",
        "event.front.rewards.pointsPerView": "points per view",
        "event.front.rewards.pointsPerAttendance": "points per attendance with",
        "event.front.rewards.pointsPerSale": "points per sale of",
        
        "event.back.view": "View", 
        "event.back.menu.dashboard": "Dashboard",
        "event.back.menu.settings": "Settings",
        "event.back.menu.payout": "Payout",
        "event.back.menu.tickets": "Tickets",
        "event.back.menu.layout": "Layout",
        "event.back.menu.signup": "Sign-up",
        "event.back.menu.marketing": "Marketing",
        "event.back.menu.orders": "Orders",
        "event.back.menu.guests": "Guests",
         
        "event.back.dashboard.attended": "Attended",
        "event.back.dashboard.sold": "Sold",
        "event.back.dashboard.remaining": "Remaining",
        
        "event.back.info.label-title": "Title",
        "event.back.info.label-eventImage": "Event image",
        "event.back.info.changeEventImage": "Change",
        "event.back.info.placeholder-title": "Title: eg. Epic Party",
        "event.back.info.label-place": "Place",
        "event.back.info.placeholder-place": "Enter a location",
        "event.back.info.label-starts": "Starts",
        "event.back.info.label-ends": "Ends",
        "event.back.info.placeholder-starts": "(set start time)",
        "event.back.info.placeholder-ends": "(set end time)",
        "event.back.info.label-description": "Description",
        "event.back.info.placeholder-description": "Description: eg. The party of all parties!",
        
        "event.back.payout.bankName.label": "Bank name",
        "event.back.payout.bankName.placeholder": "Bank: eg. Nordea",
        "event.back.payout.iban.label": "IBAN",
        "event.back.payout.iban.placeholder": "IBAN: eg. FI4250001510000023",
        "event.back.payout.rcptName.label": "Recipient name",
        "event.back.payout.rcptName.placeholder": "Rcpt name: eg. John Smith",
        "event.back.payout.rcptAddress.label": "Recipient address",
        "event.back.payout.rcptAddress.placeholder": "Rcpt addr: eg. Kirkkokatu 24 B 11, 03012 Helsinki",
        "event.back.payout.invalidIban": "Invalid IBAN",
         
        "event.back.tickets.visible": "VISIBLE",
        "event.back.tickets.hidden": "HIDDEN",
        "event.back.tickets.name": "Name",
        "event.back.tickets.price": "Price",
        "event.back.tickets.quantity": "Quantity",
        "event.back.tickets.maxOrder": "Max/order",
        "event.back.tickets.public": "Public",
        "event.back.tickets.salesStart": "Sales start",
        "event.back.tickets.salesEnd": "Sales end",
        "event.back.tickets.authInvalidation": "Authorized invalidation",
        "event.back.tickets.ticketNameMissing": "Ticket name is missing",
        "event.back.tickets.priceMissing": "Ticket price is missing",
        "event.back.tickets.priceNegative": "Ticket price is negative",
        "event.back.tickets.priceIsNaN": "Ticket price is not a number",
        "event.back.tickets.qtyMissingOr0": "Quantity missing or 0",
        "event.back.tickets.qtyNegative": "Quantity is negative",
        "event.back.tickets.qtyIsNaN": "Quantity is not an integer",
        "event.back.tickets.maxOrderMissingOr0": "Max/order missing or 0",
        "event.back.tickets.maxOrderNegative": "Max/order is negative",
        "event.back.tickets.maxOrderIsNaN": "Max/order is not an integer",
        "event.back.tickets.salesStartMissing": "Sales start time missing",
        "event.back.tickets.salesEndMissing": "Sales end time missing",
        "event.back.tickets.salesEndBeforeStart": "Sales end time is before start time",
        "event.back.tickets.payoutInfoMissing": "Payout info is missing in order to create paid tickets",
        
        "event.back.layout.explanationText": "Select color scheme",
        
        "event.back.signup.explanationText": "Manage the information collected on event sign-up and ticket purchase.",
        "event.back.signup.currentFields": "Current fields",
        "event.back.signup.required": "REQUIRED",
        "event.back.signup.optional": "OPTIONAL",
        "event.back.signup.newField": "New field",
        "event.back.signup.fieldType": "Type",
        "event.back.signup.fieldName": "Name",
         
        "event.back.marketing.groupRewards": "Group rewards",
        "event.back.marketing.referralRewards": "Referral rewards",
        "event.back.marketing.conditions": "Conditions",
        "event.back.marketing.conditionType": "Type",
        "event.back.marketing.conditionUnit": "Unit",
        "event.back.marketing.conditionPoints": "Points",
        "event.back.marketing.uniqueView": "Unique view",
        "event.back.marketing.impression": "impression",
        "event.back.marketing.attendance": "attendance",
        "event.back.marketing.sale": "sale",
        "event.back.marketing.rewardPoints": "Reward points",
        "event.back.marketing.newCondition": "New condition",
        "event.back.marketing.pointRewards": "Point rewards",
        "event.back.marketing.reward.condition": "Condition",
        "event.back.marketing.reward.ticketsQty": "Qty. of tickets",
        "event.back.marketing.reward.reward": "Reward",
        "event.back.marketing.reward.name": "Name",
        "event.back.marketing.reward.code": "Code",
        "event.back.marketing.reward.description": "Description",
        "event.back.marketing.reward.points": "Points",
        "event.back.marketing.reward.saveReward": "Save reward",
        
        "event.back.orders.refundAll": "Refund all",
        "event.back.orders.order": "Order",
        "event.back.orders.contact": "Contact",
        "event.back.orders.tickets": "Tickets",
        "event.back.orders.orderTotal": "Order total",
        "event.back.orders.orderEmail": "Order e-mail",
        "event.back.orders.user": "User",
        "event.back.orders.status": "Status",
        "event.back.orders.items": "Items",
        "event.back.orders.total": "Total",
        "event.back.orders.messages.areYouSure": "Are you sure, you want to refund all refundable orders?",
        "event.back.orders.messages.inProgress": "Refund of {{refundAllStatus.ordersNum}} in progress.",
        "event.back.orders.messages.doneOk": "Refunded {{refundAllStatus.ordersNum}}/{{refundAllStatus.successOrdersNum}} refundable orders out of {{orders.length}} total orders.",
        "event.back.orders.messages.doneErrors": "Refunded {{refundAllStatus.ordersNum}}/{{refundAllStatus.successOrdersNum}} refundable orders out of {{orders.length}} total orders.",
        "event.back.orders.messages.failed": "Refund failed.",
        "event.back.orders.messages.btn-tryAgain": "Try again",
        "event.back.orders.messages.notFound": "No refundable orders found.",
         
        "event.back.guests.btn-selectAll": "Select all",
        "event.back.guests.btn-emailSelected": "Email selected",
        "event.back.guests.sentMessages": "Sent messages",
        "event.back.guests.contact": "Contact",
        "event.back.guests.orders": "Orders",
        "event.back.guests.suffix-orders": "order(s)",
        "event.back.guests.suffix-recipients": "recipient(s)",
        "event.back.guests.recipients": "Recipients",
        "event.back.guests.subject": "Subject",
        "event.back.guests.message": "Message",
        "event.back.guests.btn-send": "Send",
         
        "order.front.title": "Ticket order",
        "order.front.orderTimeText": "Time remaining to complete the order",
        "order.front.orderTimedOutText": "This order has timed out and is no longer valid",
        "order.front.btn-order": "Order",
        "order.front.ticketType": "Ticket type",
        "order.front.ticketPrice": "Price",
        "order.front.ticketQty": "Quantity",
        "order.front.orderTotal": "Order total",
        "order.front.paymentNotFinished": "Payment was not finished",
        "order.front.proceedToPayment": "Proceed to payment",
        "order.front.continuePayment": "continue payment",
        "order.front.bankOrCard": "BANK OR CARD",
        "order.front.otherPaymentMethods": "All payment methods",
        "order.front.status.paid": "PAID",
        "order.front.status.refunded": "REFUNDED",
        "order.front.viewTickets": "View tickets",
        "order.front.fulfilledMessage": "Thank you for your order! The tickets have been sent to",
        "order.front.ticketsWillBeSent": "The tickets will be sent to the e-mail address provided here",
        
        "order.back.viewOrder": "Order",
        "order.back.purchasedTickets": "Purchased tickets",
        "order.back.openTicket": "Open ticket"


    });
 
    $translateProvider.translations("fi", {
        
        "forms.dataType.email": "Sähköposti",
        "forms.dataType.confirmEmail": "Vahvista sähköposti",
        "forms.dataType.name": "Nimi",
        "forms.dataType.username": "Käyttäjänimi",
        "forms.dataType.firstName": "Etunimi",
        "forms.dataType.lastName": "Sukunimi",
        "forms.dataType.phoneNumber": "Puhelinnumero",
        "forms.dataType.address": "Osoite",
        "forms.dataType.customText": "Uusi tieto",
        
        "forms.general.cancel": "Peruuta",
        "forms.general.create": "Luo",
        "forms.general.save": "Tallenna",
        "forms.general.changed": "Muutettu",
        "forms.general.saved": "Tallennettu",
        "forms.general.created": "Luotu",
        "forms.general.edit": "Muokkaa",
        "forms.general.delete": "Poista",
        "forms.general.add": "Lisää",
        "forms.general.yes": "Kyllä",
        "forms.general.no": "Ei",
        "forms.general.back": "Takaisin",
         
        "app.header.login": "SISÄÄN",
        "app.header.logout": "ULOS",
        
        "app.logreg.title": "Kirjaudu / Rekisteröidy",
        "app.logreg.explanation": "Kirjaudu tunnuksillasi tai luo uusi tunnus. Uusi tunnus luodaan ensimmäisen kirjautumisen yhteydessä.",
        "app.logreg.email": "Sähköposti",
        "app.logreg.password": "Salasana",
        "app.logreg.hidepwd": "Piilota salasana",
        "app.logreg.btn-go": "OK",
        "app.logreg.recoverPwd": "Unohtunut salasana",
        "app.logreg.regNewUser": "Rekisteröi uusi tili",
        "app.logreg.register": "Rekisteröi",
        "app.logreg.thanks": "Kiitos rekisteröitymisestä. Tarkista sähköpostisi varmentaaksesi sähköpostiosoitteesi.",
        "app.logreg.loggedIn": "Olet kirjautunut sisään.",
        "app.logreg.agreedToTos1": "Olen lukenut",
        "app.logreg.tos": "käyttöehdot",
        "app.logreg.agreedToTos2": "ja hyväksyn ne rekisteröitymällä",
      
        "pwdRecovery.explanationText": "Salasanan vaihdossa on kaksi vaihetta:",
        "pwdRecovery.step1Text": "1) Tilaa salasananvaihtolinkki sähköpostiosoitteeseen, jolla olet rekisteröitynyt",
        "pwdRecovery.step2Text": "2) Klikkaa sähköpostiisi lähetettyä linkkiä vaihtaaksesi salasanan", 
        "pwdRecovery.recoverPwd": "Vaihda salasana",
        "pwdRecovery.pwdChanged": "Salasana on vaihdettu. Voit nyt",
        "pwdRecovery.login": "kirjautua sisään",
        "pwdRecovery.withNewPwd": "uudella salasanallasi.",
        "pwdRecovery.change": "Vaihda",
        "pwdRecovery.newPwd": "Uusi salasana",
        "pwdRecovery.mailSent": "Salasananvaihtolinkki lähetetty osoitteeseen",
        "pwdRecovery.followInstructions": "Seuraa sähköpostiisi lähetettyjä ohjeita vaihtaaksesi salasanan.",
         
        "app.findEvents.title": "Etsi tapahtumia",
        "app.findEvents.searchFilters": "Hakukriteerit",
        "app.findEvents.searchText": "Hae nimellä, tyypillä, paikkakunnalla...",
        
        "app.myEvents.title": "Omat tapahtumat",
        "app.myEvents.add": "Uusi",
        "app.myEvents.createEvent": "Luo tapahtuma",
        "app.myEvents.noEventsText": "Et ole vielä luonut omia tapahtumia :(",
        "app.myEvents.noEventsNew": "Luo tapahtuma",
        "app.myEvents.sold": "Myyty",
        "app.myEvents.reserved": "Varattu",
        "app.myEvents.remains": "Jäljellä",
        
        "app.myTickets.title": "Minun lippuni",
        "app.myTickets.noTicketsText": "Et ole vielä hankkinut lippuja :(",
        
        "event.front.manage": "Asetukset",
        "event.front.tickets.title": "Liput",
        "event.front.tickets.type": "Lipun tyyppi",
        "event.front.tickets.price": "Hinta",
        "event.front.tickets.quantity": "Lkm",
        "event.front.tickets.total": "Yhteensä",
        "event.front.tickets.soldOut": "Loppuunmyyty",
        "event.front.tickets.noAvailableTickets": "Tähän tapahtumaan ei ole julkisesti saatavilla olevia lippuja tällä hetkellä.",
        "event.front.tickets.addEditTickets": "Voit lisätä lippuja ja/tai muuttaa lippujen näkyvyyttä ja myyntipäivämääriä",
        "event.front.tickets.eventManagement": "tapahtuman asetuksista",
       
        "event.front.rewards.groupRewards": "Ryhmäpalkinnot",
        "event.front.rewards.referralRewards": "Linkkipalkinnot",
        "event.front.rewards.shareToGet": "Jaa saadaksesi nämä palkinnot",
        "event.front.rewards.logIn": "Kirjaudu sisään",
        "event.front.rewards.startSharingGroup": "aloittaaksesi!",
        "event.front.rewards.startSharingRef": "aloittaaksesi!",
        "event.front.rewards.pointsRequired": "pistettä",
        "event.front.rewards.pointsPerView": "pistettä per katselukerta",
        "event.front.rewards.pointsPerAttendance": "pistettä osallistujasta lipulla",
        "event.front.rewards.pointsPerSale": "pistettä myynnistä lipulla",
        
        "event.back.view": "Tapahtuma", 
        "event.back.menu.dashboard": "Statistiikka",
        "event.back.menu.settings": "Tiedot",
        "event.back.menu.payout": "Maksut",
        "event.back.menu.tickets": "Liput",
        "event.back.menu.layout": "Ulkonäkö",
        "event.back.menu.signup": "Osallistujatiedot",
        "event.back.menu.marketing": "Markkinointi",
        "event.back.menu.orders": "Tilaukset",
        "event.back.menu.guests": "Osallistujat",
        
        "event.back.dashboard.attended": "Osallistunut",
        "event.back.dashboard.sold": "Myyty",
        "event.back.dashboard.remaining": "Jäljellä",
         
        "event.back.info.label-title": "Nimi",
        "event.back.info.label-eventImage": "Tapahtumakuva",
        "event.back.info.changeEventImage": "Vaihda",
        "event.back.info.placeholder-title": "Nimi: esim. Juhlakonsertti",
        "event.back.info.label-place": "Paikka",
        "event.back.info.placeholder-place": "Kirjoita sijainti",
        "event.back.info.label-starts": "Alkaa",
        "event.back.info.label-ends": "Loppuu",
        "event.back.info.placeholder-starts": "(aseta aloitusaika)",
        "event.back.info.placeholder-ends": "(aseta lopetusaika)",
        "event.back.info.label-description": "Kuvaus",
        "event.back.info.placeholder-description": "Kuvaus: esim. Kaikkien aikojen party!",
       
        "event.back.payout.bankName.label": "Pankin nimi",
        "event.back.payout.bankName.placeholder": "Pankki: esim. Nordea",
        "event.back.payout.iban.label": "IBAN",
        "event.back.payout.iban.placeholder": "IBAN: esim. FI4250001510000023",
        "event.back.payout.rcptName.label": "Vastaanottajan nimi",
        "event.back.payout.rcptName.placeholder": "Nimi: esim. Matti Virtanen",
        "event.back.payout.rcptAddress.label": "Vastaanottajan osoite",
        "event.back.payout.rcptAddress.placeholder": "Osoite: esim. Kirkkokatu 24 B 11, 03012 Helsinki",
        "event.back.payout.invalidIban": "Virheellinen IBAN",
        
        "event.back.tickets.visible": "NÄKYY",
        "event.back.tickets.hidden": "EI NÄY",
        "event.back.tickets.name": "Nimi",
        "event.back.tickets.price": "Hinta",
        "event.back.tickets.quantity": "Määrä",
        "event.back.tickets.maxOrder": "Max/tilaus",
        "event.back.tickets.public": "Julkinen",
        "event.back.tickets.salesStart": "Myynti alkaa",
        "event.back.tickets.salesEnd": "Myynti loppuu",
        "event.back.tickets.authInvalidation": "QR-leimaus",
        "event.back.tickets.ticketNameMissing": "Lipun nimi puuttuu",
        "event.back.tickets.priceMissing": "Lipun hinta puuttuu",
        "event.back.tickets.priceNegative": "Lipun hinta on negatiivinen",
        "event.back.tickets.priceIsNaN": "Lipun hinta ei ole numero",
        "event.back.tickets.qtyMissingOr0": "Määrä puuttuu tai on 0",
        "event.back.tickets.qtyNegative": "Määrä negatiivinen",
        "event.back.tickets.qtyIsNaN": "Määrä ei ole kokonaisluku",
        "event.back.tickets.maxOrderMissingOr0": "Max/tilaus puuttuu tai on 0",
        "event.back.tickets.maxOrderNegative": "Max/tilaus on negatiivinen",
        "event.back.tickets.maxOrderIsNaN": "Max/tilaus ei ole kokonaisluku",
        "event.back.tickets.salesStartMissing": "Myynnin alku puuttuu",
        "event.back.tickets.salesEndMissing": "Myynnin loppu puuttuu",
        "event.back.tickets.salesEndBeforeStart": "Myynnin loppu on ennen alkua",
        "event.back.tickets.payoutInfoMissing": "Pankkitiedot puuttuvat maksullisten lippujen luomiseksi",
        
        "event.back.layout.explanationText": "Valitse tapahtumasivun väri",
                
        "event.back.signup.explanationText": "Valitse, mitä tietoja kerätään ihmisiltä, jotka tilaavat lippuja tapahtumaan.",
        "event.back.signup.currentFields": "Kerätyt tiedot",
        "event.back.signup.required": "PAKOLLINEN",
        "event.back.signup.optional": "EI-PAKOLLINEN",
        "event.back.signup.newField": "Uusi tieto",
        "event.back.signup.fieldType": "Tyyppi",
        "event.back.signup.fieldName": "Nimi",
       
        "event.back.marketing.groupRewards": "Ryhmäpalkinnot",
        "event.back.marketing.referralRewards": "Linkkipalkinnot",
        "event.back.marketing.conditions": "Säännöt",
        "event.back.marketing.conditionType": "Tyyppi",
        "event.back.marketing.conditionUnit": "Yksikkö",
        "event.back.marketing.conditionPoints": "Pisteet",
        "event.back.marketing.uniqueView": "Katselukerta",
        "event.back.marketing.impression": "tapahtumasivuvierailu",
        "event.back.marketing.attendance": "osallistuminen",
        "event.back.marketing.sale": "myynti",
        "event.back.marketing.rewardPoints": "Palkintopisteet",
        "event.back.marketing.newCondition": "Uusi sääntö",
        "event.back.marketing.pointRewards": "Pistepalkinnot",
        "event.back.marketing.reward.condition": "Sääntö",
        "event.back.marketing.reward.ticketsQty": "Lippujen lkm.",
        "event.back.marketing.reward.reward": "Palkinto",
        "event.back.marketing.reward.name": "Nimi",
        "event.back.marketing.reward.code": "Koodi",
        "event.back.marketing.reward.description": "Kuvaus",
        "event.back.marketing.reward.points": "Pisteet",
        "event.back.marketing.reward.saveReward": "Tallenna palkinto",
        
        "event.back.orders.refundAll": "Hyvitä kaikki",
        "event.back.orders.order": "Tilaus",
        "event.back.orders.contact": "Yhteystiedot",
        "event.back.orders.tickets": "Liput",
        "event.back.orders.orderTotal": "Tilauksen summa",
        "event.back.orders.orderEmail": "Tilauksen sähköposti",
        "event.back.orders.user": "Käyttäjä",
        "event.back.orders.status": "Status",
        "event.back.orders.items": "Tuotteet",
        "event.back.orders.total": "Yhteensä",
        "event.back.orders.messages.areYouSure": "Olet hyvittämässä kaikkia hyvitettävissä olevia tilauksia. Haluatko jatkaa?",
        "event.back.orders.messages.inProgress": "{{ordersNum}} tilauksen hyvitys käynnissä.",
        "event.back.orders.messages.doneOk": "Hyvitetty {{ordersNum}}/{{successOrdersNum}} hyvitettävissä ollutta tilausta {{ordersTotal}} tilauksesta yhteensä.",
        "event.back.orders.messages.doneErrors": "Hyvitetty {{ordersNum}}/{{successOrdersNum}} hyvitettävissä ollutta tilausta {{ordersTotal}} tilauksesta yhteensä.",
        "event.back.orders.messages.failed": "Hyvitys epäonnistui.",
        "event.back.orders.messages.btn-tryAgain": "Yritä uudestaan",
        "event.back.orders.messages.notFound": "Ei hyvitettävissä olevia tilauksia.",
        
        "event.back.guests.btn-selectAll": "Valitse kaikki",
        "event.back.guests.btn-emailSelected": "Lähetä valituille",
        "event.back.guests.sentMessages": "Lähetetyt",
        "event.back.guests.contact": "Yhteystiedot",
        "event.back.guests.orders": "Tilaukset",
        "event.back.guests.suffix-orders": "tilaus(ta)",
        "event.back.guests.suffix-recipients": "vastaanottaja(a)",
        "event.back.guests.recipients": "Vastaanottajat",
        "event.back.guests.subject": "Aihe",
        "event.back.guests.message": "Viesti",
        "event.back.guests.btn-send": "Lähetä",
         
        "order.front.title": "Lippujen tilaus",
        "order.front.orderTimeText": "Aikaa jäljellä tilauksen päättämiseen",
        "order.front.orderTimedOutText": "Tilaus ei ole enää voimassa. Tilausaika on päättynyt.",
        "order.front.btn-order": "Tilaa",
        "order.front.ticketType": "Lipun tyyppi",
        "order.front.ticketPrice": "Hinta",
        "order.front.ticketQty": "Lkm",
        "order.front.orderTotal": "Tilauksen summa",
        "order.front.paymentNotFinished": "Maksu on keskeytetty",
        "order.front.proceedToPayment": "Siirry maksamaan",
        "order.front.continuePayment": "jatka maksamista",
        "order.front.bankOrCard": "PANKKI TAI KORTTI",
        "order.front.otherPaymentMethods": "Kaikki maksutavat",
        "order.front.status.paid": "MAKSETTU",
        "order.front.status.refunded": "HYVITETTY",
        "order.front.viewTickets": "Liput",
        "order.front.fulfilledMessage": "Kiitos tilauksestasi! Liput on lähetetty osoitteeseen ",
        "order.front.ticketsWillBeSent": "Liput lähetetään täällä antamaasi sähköpostiosoitteeseen",
        
        "order.back.viewOrder": "Tilaus",
        "order.back.purchasedTickets": "Ostetut liput",
        "order.back.openTicket": "Avaa lippu"
    
    });
     
    $translateProvider.preferredLanguage("en");

});
