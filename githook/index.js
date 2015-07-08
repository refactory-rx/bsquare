//Lets require/import the HTTP module
var http = require('http');

//Lets define a port we want to listen to
const PORT = 3420; 

//We need a function which handles requests and send response
function handleRequest(request, response) {
     
    var body = "";
    
    request.on("data", function(data) {
        body += data;
    });
    
    request.on("end", function() {
        
        var message = JSON.parse(body);
        console.log(message);
        
        response.end('It Works!! Path Hit: ' + request.url);
        
        if (message.hook.events.indexOf("push") != -1) {
            console.log("PUSH DETECTED");
            var exec = require("child_process").exec;
            var child = exec("./restart.sh", function(error, stdout, stderr) {
                console.log("stdout: ", stdout);
                console.log("stderr: ", stderr);
                if (error) {
                    console.log("error: ", error);
                }
            });
        }

    });

}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function() {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});
