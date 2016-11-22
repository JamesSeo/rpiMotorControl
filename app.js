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

var cur_key = "stop";
var x = 0.5;
var y = 0.5;
var inc = 0.005;
var total_con = 0;
var is_repeat = false;
var port = 8082;


function get_pos(start, end, portion){
 return start + Math.floor((end-start) * portion);
}

function get_pos_updown(portion) {
	return get_pos(range_up[0], range_up[1], portion);
}
function get_pos_leftright(portion) {
	return get_pos(range_lr[0], range_lr[1], portion);
}

// l_r : 0.0 ~ 1.0
function set_pos(ix, iy){
	angle_lr =  get_pos_leftright(ix); 
	angle_ud =  get_pos_updown(iy);
	pwm.setPulseLength(1, angle_lr);	
	pwm.setPulseLength(0, angle_ud);	
	send_info_pos();
}

function send_info(info){
   	io.emit('info',info );
}


function send_info_time() {
	var time_info = "time:" + new Date();
	send_info(time_info);
}


function send_info_pos() {
   	send_info("con:" + total_con + " pos:" + Math.floor(x * 100) + "," + Math.floor(y * 100));
}


function move_cam() {
  if (cur_key=="stop" || cur_key=="reset") {
	if (cur_key=="stop") 
		return;	
	set_pos(0.5, 0.5);
	return ;
  }

  if (cur_key=="up"){
    y = Math.max(0,y-inc);
    if (y == 0 && is_repeat){
	cur_key = "down";
        console.log("direction changed: to down");
    }
  }
  if (cur_key=="down") {
    y = Math.min(1,y + inc);
    if (y == 1 && is_repeat) {
	cur_key = "up";
        console.log("direction changed: to up");

    }
  }
  if (cur_key=="left"){
    x = Math.min(1, x + inc);
    if (x == 1 && is_repeat){
	cur_key = "right";
        console.log("direction changed: to right");
    }
  }
  if (cur_key=="right"){
    x = Math.max(0, x - inc);
    if (x == 0 && is_repeat){
	cur_key = "left";
        console.log("direction changed: to left");
    }
  }

   //console.log(x,y);
   set_pos(x, y);
}


set_pos(x,y);
setInterval(move_cam, 300);
setInterval(send_info_time, 1000);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', function(socket){
  console.log('a user connected');
  total_con += 1;
//pwm.setPulseLength(0, angle_ud);	
//pwm.setPulseLength(1, angle_lr);	

  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
  });

  socket.on('command:dir', function(msg){
    console.log('dir: ' + msg);
    if (msg.indexOf("repeat")>=0){
	is_repeat = (msg.indexOf("true")>=0);
	console.log("Repeat:", is_repeat);
	return ;
    }
    cur_key = msg;
  });

  socket.on('command:info', function(info){
    console.log('rev info request: ' + info);
    send_info_pos();
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
    total_con -= 1;
    cur_key = "stop";
	
  });

});



http.listen(port, function(){
  console.log('listening on *:', port);
});
