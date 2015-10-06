var serialPort = require("serialport");
CodeMirror.modeURL = "assets/codemirror/mode/%N/%N.js";
var clips = [];
angular.module('xapp', ['ngSanitize', 'hljs', 'ui.codemirror', 'treeControl']).controller('ctrl', function($scope, $interval, $timeout) {
	var hljs = document.querySelector('.hljs')
	var input = document.querySelector('#cmd')
	$scope.baudrates = [
		9600, 19200, 38400, 57600, 115200, 230400, 250000 
	];
	$scope.baudrate = 9600;
	serialPort.list(function (err, ports) {
		$scope.$apply(function() {
			$scope.ports = ports;
			$scope.port = ports[ports.length - 1];
			$scope.selectPort($scope.port.comName);
		});
	});
	var history = [];
	var pointer = 0;
	$scope.focus = function() {
		input.focus();
		input.selectionStart = input.selectionEnd = input.value.length;
	};
	$scope.treeOptions = {
	    nodeChildren: "children",
	    dirSelectable: true,
	    injectClasses: {
	        ul: "a1",
	        li: "a2",
	        liSelected: "a7",
	        iExpanded: "a3",
	        iCollapsed: "a4",
	        iLeaf: "a5",
	        label: "a6",
	        labelSelected: "a8"
	    }
	}
	$scope.files = [];
	$scope.showSelected = function(node) {
		$scope.serial.readFile(node.path, node.size)
	}
	$scope.input = function(event) {
		if(!$scope.serial)
			return;
		//var c = String.fromCharCode(event.charCode);
		if(event.keyCode == 38 && pointer > 0) {//up
			pointer--;	
			$scope.cmd = history[pointer];
			$scope.focus()
		}
		if(event.keyCode == 40 && pointer < history.length) {//down
			pointer++;
			$scope.cmd = history[pointer];
			$scope.focus()
		}
		if(event.keyCode != 13)
			return;
		var cmd = $scope.cmd;
		history.push(cmd);
		pointer = history.length;
		$scope.cmd = '';
		$scope.serial.write(cmd + "\n", function(err, result) {
			if(err)
				alert(err);
		});
	};
	$scope.output = '';
	$scope.selectPort = function(com) {
		var serial = $scope.serial = new Serial(com, $scope.baudrate);
		serial.onRead(function(data) {
			$scope.$apply(function() {
				$scope.output += data;
				$timeout(function() {
					hljs.scrollTop = hljs.scrollHeight;
				});
			});
		});
		serial.onInit(function() {
			serial.getFiles(function(files) {
				$scope.$apply(function() {
					$scope.files = files.map(function(row) {
						var split = row[0].split('/');
						var name = split.shift();
						var children = split.shift();
						if(children)
							return {name: name, children: [{
								name: children,
								path: name + '/' + children,
								size: row[1]
							}]}
						else
							return {name: name, path: name, size: row[1]}
					});
				});
			});
			$scope.$apply(function() {
				$scope.output = ">\n";
			});
		});
	};
	var Serial = function(port, baudrate) {
		var reader = function() {}, init = function() {};
		var serial = new serialPort.SerialPort(port, {
			baudrate: baudrate
		});
		var buffer = "";
		serial.open(function (error) {
			if ( error ) {
				return console.log('failed to open: '+error);
			}
			init();
			serial.on('data', function(data) {
				buffer += data;
				reader(data);
			});
		});
		function execute(cmd, cb) {
			var _r = reader;
			var lastRead;
			var str = "";
			reader = function(data) {
				lastRead = new Date;
				str += data;
			}
			var timer = setInterval(function() {
				var now = new Date;
				if(now - lastRead < 500)
					return;
				reader = _r;
				clearInterval(timer);
				console.log(str)
				var arr = str.toString().split("\n");
				cb(arr.slice(cmd.split("\n").length).slice(0, -1).join("\n"))
			}, 100);
			var cmds = cmd.split("\n");
			for(var i in cmds) {
				setTimeout((function(cmd) {
					return function() {
						serial.write(cmd + "\n");
					}
				})(cmds[i]), 150 * i);
			}
		}
		return {
			readFile: function(file, size) {
    			execute(`file.open("${file}", "r")
    				data = file.read(${size})
    				file.close()
    				print(data)`, function(res) {
					console.log(res);
				})
			},
			getFiles: function(cb) {
				execute(`l = file.list();
					for k,v in pairs(l) do
					  print(k..":"..v)
					end`, function(res) {
					cb(res.split("\n").map(function(row) {
						return row.split(":");
					}))
				})
			},
			write: function(data, cb) {
				serial.write(data, cb);
			},
			onRead: function(cb) {
				reader = cb;
			},
			onInit: function(cb) {
				init = cb;
			}
		}
	};


});
