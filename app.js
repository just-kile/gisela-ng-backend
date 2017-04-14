var express = require("express");
var bodyParser = require("body-parser");
var cors = require('cors');
var app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


var routes = require("./routes/routes.js")(app);




//var server = https.createServer(options, app).listen(port, function(){
//  console.log("Express server listening on port " + port);
//});


var server = app.listen(3000, function () {
    console.log("Listening on port %s...", server.address().port);
});
