/**
 * Created by noamc on 8/31/14.
 */
var binaryServer = require('binaryjs').BinaryServer,
    http = require('http'),
    wav = require('wav'),
    opener = require('opener'),
    fs = require('fs'),
    connect = require('connect'),
    serveStatic = require('serve-static'),
    UAParser = require('./ua-parser');

var uaParser = new UAParser();

if(!fs.existsSync("recordings"))
    fs.mkdirSync("recordings");

var app = connect();

app.use(serveStatic('public'));

var httpServer = http.createServer(app);
httpServer.listen(8080);

opener("http://localhost:8080");

var wsServer = binaryServer({server:httpServer});

wsServer.on('connection', function(client) {
    console.log("new connection...");
    var fileWriter = null;

    var userAgent  =client._socket.upgradeReq.headers['user-agent'];
    uaParser.setUA(userAgent);
    var ua = uaParser.getResult();

    client.on('stream', function(stream, meta) {

        console.log("Stream Start@" + meta.sampleRate +"Hz");
        var fileName = "recordings/"+ ua.os.name +"-"+ ua.os.version +"_"+ new Date().getTime()  + ".wav";
        fileWriter = new wav.FileWriter(fileName, {
            channels: 1,
            sampleRate: meta.sampleRate,
            bitDepth: 16
        });

        stream.pipe(fileWriter);
    });

    client.on('close', function() {
        if (fileWriter != null) {
            fileWriter.end();
        }
        console.log("Connection Closed");
    });
});
