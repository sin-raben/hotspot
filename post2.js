'use strict';
/*jshint node:true */
// http://127.0.0.1:3000/echo?message=Hello -> Hello
var http = require('http');
var url = require('url');
var fs = require('fs');
var server = new http.Server(function(req, res) {
    var urlParsed = url.parse(req.url, true);
    console.log("urlParsed", urlParsed);
    if (urlParsed.pathname == '/echo' && urlParsed.query.message) {
        res.setHeader('Cache-control', 'no-cache,no-store,must-revalidate');
        //debugger;
        res.end(urlParsed.query.message);
    } else {
        res.statusCode = 404; // Not Found
        res.end("Page not found");
    }
});

server.listen(3000, '192.168.0.97');
