var app = require('express')();
var http = require('http').Server(app);

var io = require('socket.io')(http);

var i2cBus = require("i2c-bus");
var Pca9685Driver = require("pca9685").Pca9685Driver;

var options = {
    i2c: i2cBus.openSync(1),
    address: 0x40,
    frequency: 60,
    debug: false
};
pwm = new Pca9685Driver(options, function() {
    console.log("Initialization done");
});

var range_up=[900,1850];
var range_lr=[1150,2000];
var mid_up = Math.floor( (range_up[0]+range_up[1])/2);
var mid_lr = Math.floor( (range_lr[0]+range_lr[1])/2);
var angle_ud = mid_up; //1000~2000 updown  900-1850        
var angle_lr = mid_lr; //1000~2000 left right  :  1150-1300

var cur_key = "";

function move_cam() {
  console.log('cur_dir:',cur_key );
  if (cur_key=="" || cur_key=="stop") 
	return ;

  if (cur_key=="up")
    angle_ud = Math.max(range_up[0],angle_ud-3);
  if (cur_key=="down")
    angle_ud = Math.min(range_up[1],angle_ud+3);
  if (cur_key=="left")
    angle_lr = Math.min(range_lr[1], angle_lr+3);
  if (cur_key=="right")
    angle_lr = Math.max(range_lr[0], angle_lr-3);

   console.log("lr, up", angle_lr, angle_ud);
   pwm.setPulseLength(0, angle_ud);
   pwm.setPulseLength(1, angle_lr); 
}



pwm.setPulseLength(0, angle_ud);	
pwm.setPulseLength(1, angle_lr);	

setInterval(move_cam, 500);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', function(socket){
  console.log('a user connected');
//pwm.setPulseLength(0, angle_ud);	
//pwm.setPulseLength(1, angle_lr);	

  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
  });
  socket.on('command:dir', function(msg){
    console.log('dir: ' + msg);
    cur_key = msg;
	if (msg=="up")
		angle_ud = Math.max(range_up[0],angle_ud-50);
	if (msg=="down") 
		angle_ud = Math.min(range_up[1],angle_ud+50);
	if (msg=="left")
		angle_lr = Math.min(range_lr[1], angle_lr+50);
	if (msg=="right") 
		angle_lr = Math.max(range_lr[0], angle_lr-50);
	
	console.log("lr, up", angle_lr, angle_ud);
	pwm.setPulseLength(0, angle_ud);	
	pwm.setPulseLength(1, angle_lr);	

  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

});



http.listen(8082, function(){
  console.log('listening on *:8081');
});
