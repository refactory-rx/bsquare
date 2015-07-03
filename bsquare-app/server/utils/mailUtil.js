var nodemailer = require("nodemailer");

module.exports = {
	
    sendEmail: function(emailAddress, emailSubject, emailTextHtml, emailTextPlain, callback) {
    	
    	var result = {
    		success: 0,
    		status: 'none'
    	};
    	
        // create reusable transport method (opens pool of SMTP connections)
        var smtpTransport = nodemailer.createTransport("SMTP", {
            service: "Gmail",
            auth: {
                user: MAIL_USERNAME,
                pass: MAIL_PASSWORD
            }
        });
        
        result.status = 'transport created';
        
        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: MAIL_FROM, // sender address
            to: emailAddress, // list of receivers
            subject: emailSubject, // Subject line
            text: emailTextPlain, // plaintext body
            html: emailTextHtml // html body
        };
    
            // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(err, response){
            
        	if(err) {
                //console.log(error);
                result.status = 'error';
                result.error = err;
            } else {
                //console.log("Message sent: " + response.message);
                result.status = 'sent';
                result.response = response;
                result.success = 1;
            }
            
        	callback(result);
        	
            smtpTransport.close(); // shut down the connection pool, no more messages
        
        });
        
    }
        
};