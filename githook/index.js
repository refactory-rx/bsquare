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
        
        if (message.commits && message.commits.length > 0) {
            
            console.log("PUSH DETECTED");
            
            var spawn = require("child_process").spawn;
            var process = spawn("./restart.sh");
            
            process.stdout.on("data", function(data) {
                console.log("stdout: " + data);
            });
            
            process.stderr.on("data", function(data) {
                console.log("stdout: " + data);
            });
            
            process.stderr.on("exit", function(code) {
                console.log("exit: " + code);
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
