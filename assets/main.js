var serial = require('./serial-proxy');
CodeMirror.modeURL = "assets/codemirror/mode/%N/%N.js";
var clips = [];
window.addEventListener('beforeunload', function() {
	serial.kill();
});
angular.module('xapp', ['ngSanitize', 'hljs', 'ui.codemirror', 'treeControl']).controller('ctrl', function($scope, $interval, $timeout) {
	var hljs = document.querySelector('.hljs');
	var input = document.querySelector('#cmd');
	var editor;
	CodeMirror.commands.save = function(insance) { 
		 $scope.serial.saveFile($scope.file, editor.getValue());
	}
	$scope.editor = {content: '', option: {
			mode: 'lua',
			theme: 'solarized dark',
			lineNumbers: true,
			viewportMargin: Infinity,
			onLoad: function(_cm) {
				try {
					CodeMirror.autoLoadMode(_cm, this.mode);
				} catch(e) {}
				editor = _cm;
			}
		}
	};
	$scope.baudrates = [
		9600, 19200, 38400, 57600, 115200, 230400, 250000 
	];
	$scope.baudrate = 9600;
	serial.start();
	serial.list(function (err, ports) {
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
	$scope.file = 'untitled';
	$scope.showSelected = function(node) {
		$scope.file = node.path;
		$scope.serial.readFile(node.path, node.size, function(content) {
			editor.setValue(content);

		})
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
			$scope.$apply(function() {
				$scope.output = ">\n";
			});

			serial.getFiles(function(files) {
				$scope.$apply(function() {
					console.log(files.length);
					$scope.files = files.map(function(row) {
						var split = row[0].split('/');
						var name = split.shift();
						var children = split.shift();
						console.log(children, name)
						if(children)
							return {name: name, children: [{
								name: children,
								path: name + '/' + children,
								size: row[1]
							}]}
						else
							return {name: name, path: name, size: row[1]}
					}).reduce(function(files, file) {
						for(var i in files) {
							if(files[i].children && file.name == files[i].name) {
								files[i].children = files[i].children.concat(file.children);
								return files;
							}
						}
						files.push(file);
						return files;
					}, []);
					console.log($scope.files);
				});
			});
			
		});
	};
	var Serial = function(port, baudrate) {
		var reader = function() {}, init = function() {};
		var buffer = "";

		serial.open(port, {baudrate: baudrate}, function(err, data) {
			init();
		});
		serial.on('data', function(err, data) {
			buffer += data;
			reader(data);
		})
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
			readFile: function(file, size, cb) {
    			execute(`file.open("${file}", "r")
    				data = file.read(${size})
    				file.close()
    				print(data)`, function(res) {
					cb(res);
				})
			},
			saveFile: function(path, content, cb) {
				var content = content.split("\n").map(function(line) {
					line = line.replace("\"", "\\\"");
					return `file.write("${line}");`
				}).join("\n");
				console.log(content);
				execute(`file.open("${path}", "w+");
					${content}
					file.close();`, function(res) {
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
