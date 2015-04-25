var csp = require("../../..");

var http = require('http');
var express = require("express");
var serveSpa = require("serve-spa");
var path = require('path');


var app = express();
var server = http.createServer(app);

app.use(csp({
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    frameSrc: ["'self'"],
    imgSrc: ["'self'"],
    scriptSrc: ["'self'", "https://code.jquery.com", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    safari5: true
}));

app.get('/hello', function (req, res) {
    res.send('hello');
});

serveSpa(app, path.join(__dirname, './test-page/'));

server.listen(3000);
