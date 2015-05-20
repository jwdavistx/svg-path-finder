var express = require('express');
var path = require('path');
var app = express();

var port = process.env.port || 1234;

app.use(express.static(path.join(__dirname, '/')));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.listen(port);

console.log('listening on port: ', port);