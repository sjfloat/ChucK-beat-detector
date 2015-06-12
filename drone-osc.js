var osc = require("node-osc");
var ard = require("ar-drone");

function DroneControl() {
	var self = this;
	this.flying = false;
	self.drone = ard.createClient();
	this.register = function(address, callback) {
		self[address] = function(address, data) {
			var sliced = data.slice(1);
			callback(self.drone, address, sliced);
		}
		return self;
	}
}

var srv = new osc.Server(8081, "0.0.0.0");

var dc = new DroneControl();
dc.register("/test/op", function(drone, address, data) {
	console.log(data)
})
.register("/takeoff", function(drone, address, data) {
	drone.takeoff(function() {
		dc.flying = true;
	});
})
.register("/land", function(drone, address, data) {
	drone.stop();
	drone.land(function() {
		dc.flying = false;
	});
})
;

["left", "right", 
	"up", "down", 
	"clockwise", "counterClockwise",
	"front", "back"].forEach(function(direction) {
		dc.register("/move/"+direction, function(drone, address, data) {
			drone[direction](data[0]);
		});
	});
['phiM30Deg', 'phi30Deg', 'thetaM30Deg', 
	'theta30Deg', 'theta20degYaw200deg',
	'theta20degYawM200deg', 'turnaround', 
	'turnaroundGodown', 'yawShake',
	'yawDance', 'phiDance', 'thetaDance', 
	'vzDance', 'wave', 'phiThetaMixed',
	'doublePhiThetaMixed', 'flipAhead', 
	'flipBehind', 'flipLeft', 'flipRight']
.forEach(function(anim) {
	dc.register("/anim/" + anim, function(drone, address, data) {
		drone.animate(anim, data[0]);
	})
});
['blinkGreenRed', 'blinkGreen', 'blinkRed', 
	'blinkOrange', 'snakeGreenRed',
	'fire', 'standard', 'red', 'green', 
	'redSnake', 'blank', 'rightMissile',
	'leftMissile', 'doubleMissile', 'frontLeftGreenOthersRed',
	'frontRightGreenOthersRed', 'rearRightGreenOthersRed',
	'rearLeftGreenOthersRed', 'leftGreenRightRed', 
	'leftRedRightGreen','blinkStandard']
.forEach(function(light) {
	dc.register("/light/" + light, function(drone, address, data) {
		drone.animateLeds(light, data[0], data[1]);
	})
});

srv.on("message", function(msg, rinfo) {
	var address = msg[0];
	var resolved = dc[address];
	resolved.call(dc, address, msg);
});