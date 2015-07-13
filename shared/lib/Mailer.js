module.exports = (app) => {
    
    let { SENDGRID_FROM } = app.settings;

    return {

        sendMail: (email, callback) => {

            app.sendgrid.send(Object.assign(email, { from: SENDGRID_FROM }), (err, response) => {
                callback(err, response);
            });

        },

        queueMail: (email) => {
        }
    
    };

};
