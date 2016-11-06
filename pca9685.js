var i2cBus = require("i2c-bus");
var Pca9685Driver = require("pca9685").Pca9685Driver;
 
var options = {
    i2c: i2cBus.openSync(1),
    address: 0x40,
    frequency: 50,
    debug: false
};
pwm = new Pca9685Driver(options, function() {
    console.log("Initialization done");
});
 
// Set channel 0 to turn on on step 42 and off on step 255 
pwm.setPulseRange(0, 180, 600);
 
// Set the pulse length to 1500 microseconds for channel 2 
//pwm.setPulseLength(2, 1500);
 
// Set the duty cycle to 25% for channel 8 
//pwm.setDutyCycle(0, 0.55);
var pulse = 1000;// 1000~2000
setInterval(function() {
	pwm.setPulseLength(0, pulse);
	console.log("pulse:", pulse);
	pulse += 10;
	}, 1000);
