var serialPort = require("serialport");
var cp = require('child_process');
var child;
var cmdId = 0;
var callbacks = [];

exports.start = function() {
	child = cp.fork('./serial-proxy');
	child.on('message', function(msg) {
		if(msg.id)
			callbacks[msg.id](msg.err, msg.data);
	});
}
exports.kill = function() {
	process.kill(child.pid);
}
exports.open = function(port, options, cb) {
	cmdId++;
	callbacks[cmdId] = cb;
	child.send({cmd: 'open', port: port, options:options, id: cmdId});
}
exports.write = function(chars)　{
	child.send({cmd: 'write', chars: chars});	
}

exports.list = function(cb) {
	cmdId++;
	callbacks[cmdId] = cb;
	child.send({cmd: 'list', id: cmdId});
}
exports.on = function(type, cb) {
	cmdId++;
	callbacks[cmdId] = cb;
	child.send({cmd: 'on' + type, id: cmdId});
}
var port;
var reader = -1;
var commands = {
	open: function(msg) {
		port = new serialPort.SerialPort(msg.port, msg.options);
		port.open(function(err) {
			if (err) 
				return;
			process.send({err: null, data: '', id: msg.id});
			port.on('data', function(data) {
				process.send({err: null, data: data.toString(), id: reader});
			});

		});
	},
	ondata: function(msg) {
		reader = msg.id;
	},
	write:　function(msg) {
		//process.send({err: null, data: msg.chars, id: 3});
		port.write(msg.chars);
	},
	list: function(msg) {
		serialPort.list(function(err, ports) {
			process.send({err: err, data: ports, id: msg.id});
		});
	}
}

process.on('message', function(msg) {
	commands[msg.cmd](msg);
});
process.on('SIGINT', function() {
	process.exit();
});