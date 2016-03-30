
var fs = require('fs');

var configuration = JSON.parse(
    fs.readFileSync("conf/application.json")
);

var request = require("request")
, sprintf = require("sprintf-js").sprintf
, _ = require("lodash");
;

var express = require('express.io');
var app = express();
app.http().io();
app.use(express.static(__dirname + '/public'));

var kafka = require('kafka-node'),
    HighLevelConsumer = kafka.HighLevelConsumer,
    client = new kafka.Client()
;

var kafkaConsumer = new HighLevelConsumer( client, [
            { topic: configuration["geofence.topic"] },
            { topic: configuration["celltower.stats.topic"] }
        ]
    );

var WebServerPort = configuration["http.port"] || 3010;
var GeofenceFile = configuration["geofence.file"];

/* handle geofences get request from client */
app.get('/geofences', function(req, res, next) {
    fs.readFile(GeofenceFile, 'utf8', function (err, geofences) {
        if (err) return console.log(err);
        res.json(JSON.parse(geofences));
    });
});

kafkaConsumer.on('message', function (message) {
    var object = JSON.parse(message.value);
    app.io.sockets.emit(message.topic, object);
});

app.io.route('geofences-write', function(req) {
    console.log("persisting geofences");
    fs.writeFile(GeofenceFile, JSON.stringify(req.data), function(err) {
        if(err) return console.log(err);
    });
});


/* start web server */
app.listen(WebServerPort, function(){
    console.log('web server listening at 0.0.0.0:%s', WebServerPort);
});

