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
exports.open = function(port, options) {
	cmdId++;
	callbacks[cmdId] = function(err, data) {
		console.log(data);
	};
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
var port;
var commands = {
	open: function(msg) {
		port = new serialPort.SerialPort(msg.port, msg.options);
		port.open(function(err) {
			if (err) 
				return;
			
			port.on('data', function(data) {
				process.send({err: null, data: data.toString(), id: msg.id});
				//process.send({data: 'abc', id: msg.id});
			});

		});
	},
	write:　function(msg) {
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