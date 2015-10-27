var Menu = require('menu');
var MenuItem = require('menu-item');
var serialPort = require("serialport");
var ports = 
module.exports = {
    setMenu: function (app, mainWindow) {
        if (process.platform === 'darwin') {
            var template = [
                {
                    label: 'esp-editor',
                    submenu: [
                        {
                            label: 'About esp-editor',
                            selector: 'orderFrontStandardAboutPanel:'
                        },
                        {
                            type: 'separator'
                        },
                        {
                            label: 'Quit',
                            accelerator: 'Command+Q',
                            click: function () {
                                app.quit();
                            }
                        }
                    ]
                },
                {
                    label: 'Edit',
                    submenu: [
                        {
                            label: 'Undo',
                            accelerator: 'Command+Z',
                            selector: 'undo:'
                        },
                        {
                            label: 'Redo',
                            accelerator: 'Shift+Command+Z',
                            selector: 'redo:'
                        },
                        {
                            type: 'separator'
                        },
                        {
                            label: 'Cut',
                            accelerator: 'Command+X',
                            selector: 'cut:'
                        },
                        {
                            label: 'Copy',
                            accelerator: 'Command+C',
                            selector: 'copy:'
                        },
                        {
                            label: 'Paste',
                            accelerator: 'Command+V',
                            selector: 'paste:'
                        },
                        {
                            label: 'Select All',
                            accelerator: 'Command+A',
                            selector: 'selectAll:'
                        }
                    ]
                },
                {
                    label: 'View',
                    submenu: [
                        {
                            label: 'Reload',
                            accelerator: 'Command+R',
                            click: function () {
                                mainWindow.restart();
                            }
                        },
                        {
                            label: 'Toggle Full Screen',
                            accelerator: 'Ctrl+Command+F',
                            click: function () {
                                mainWindow.setFullScreen(!mainWindow.isFullScreen());
                            }
                        },
                        {
                            label: 'Toggle Developer Tools',
                            accelerator: 'Alt+Command+I',
                            click: function () {
                                mainWindow.toggleDevTools();
                            }
                        }
                    ]
                },
                {
                    label: 'Ports',
                    submenu: (function() {
                        var _ports = [];
                        serialPort.list(function(err, ports) {
                            Array.prototype.splice.apply(_ports, [0, 0].concat(ports.map(function(port, i) {
                                return {
                                    checked: i == ports.length - 1,
                                    label: port.comName,
                                    selector: port.comName,
                                    type: 'radio',
                                    click: function(item) {
                                        console.log(arguments)
                                    }
                                };
                            })));
                            console.log(template);
                            menu = Menu.buildFromTemplate(template);
                            Menu.setApplicationMenu(menu);
                        });
                        return _ports;
                    })()
                },
                {
                    label: 'Baud Rate',
                    submenu: [9600, 19200, 38400, 57600, 115200, 230400, 250000].map(function(baud) {
                        return {
                            checked: baud == "9600",
                            label: baud + "",
                            selector: baud + "",
                            type: 'radio',
                            click: function(item) {
                                console.log(arguments)
                            }
                        };
                    })
                },
                {
                    label: 'Window',
                    submenu: [
                        {
                            label: 'Minimize',
                            accelerator: 'Command+M',
                            selector: 'performMiniaturize:'
                        },
                        {
                            label: 'Close',
                            accelerator: 'Command+W',
                            selector: 'performClose:'
                        },
                        {
                            type: 'separator'
                        },
                        {
                            label: 'Bring All to Front',
                            selector: 'arrangeInFront:'
                        }
                    ]
                },
                {
                    label: 'Help',
                    submenu: [
                        {
                            label: 'GitHub Repository',
                            click: function () {
                                require('shell').openExternal('https://github.com/mlwmlw/esp-editor')
                            }
                        }
                    ]
                }
            ];

            
        } else {
            template = [
                {
                    label: '&File',
                    submenu: [
                        {
                            label: '&Open',
                            accelerator: 'Ctrl+O'
                        },
                        {
                            label: '&Close',
                            accelerator: 'Ctrl+W',
                            click: function () {
                                mainWindow.close();
                            }
                        }
                    ]
                },
                {
                    label: '&View',
                    submenu: [
                        {
                            label: '&Reload',
                            accelerator: 'Ctrl+R',
                            click: function () {
                                mainWindow.restart();
                            }
                        },
                        {
                            label: 'Toggle &Full Screen',
                            accelerator: 'F11',
                            click: function () {
                                mainWindow.setFullScreen(!mainWindow.isFullScreen());
                            }
                        },
                        {
                            label: 'Toggle &Developer Tools',
                            accelerator: 'Alt+Ctrl+I',
                            click: function () {
                                mainWindow.toggleDevTools();
                            }
                        }
                    ]
                },
                {
                    label: 'Help',
                    submenu: [
                        {
                            label: 'GitHub Repository',
                            click: function () {
                                require('shell').openExternal('https://github.com/shockone/black-screen')
                            }
                        }
                    ]
                }
            ];

            menu = Menu.buildFromTemplate(template);
            mainWindow.setMenu(menu);
        }
    }
};
