var serialPort = require("serialport");
CodeMirror.modeURL = "assets/codemirror/mode/%N/%N.js";
var clips = [];
angular.module('xapp', ['ngSanitize', 'hljs', 'ui.codemirror']).controller('ctrl', function($scope, $interval, $timeout) {
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
	$scope.input = function(event) {
		if(!$scope.p)
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
		$scope.p.write(cmd + "\n", function(err, result) {
			if(err)
				alert(err);
		});
	};
	$scope.output = '';
	$scope.selectPort = function(com) {
		var p = $scope.p = new serialPort.SerialPort(com, {
			baudrate: $scope.baudrate
		});
		p.open(function (error) {
			if ( error ) {
				console.log('failed to open: '+error);
			} else {
				$scope.$apply(function() {
					$scope.output = ">\n";
				});
				$scope.focus();
				p.on('data', function(data) {
					$scope.$apply(function() {
						$scope.output += data;
						$timeout(function() {
							hljs.scrollTop = hljs.scrollHeight;
						});
					});
				});
			}
		});
	};
});
