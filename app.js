var express = require('express');
var app = express();
var server = require('http').createServer(app);
var sockIO = require('socket.io')();
app.sockIO = sockIO;

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.use(express.static('/home/pi/nodeapp/public'));

app.listen(8081, function () {
  console.log('Example app listening on port 8081!');
});

sockIO.listen(server);

sockIO.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('fromclient', function (data) {
        console.log(data);
    });
});
