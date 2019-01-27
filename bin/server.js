#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('gui-sc:server');
var http = require('http');
var interfaceBindTo = "0.0.0.0"; // 0.0.0.0 bind to all interfaces, localhost or 127.0.0.1 bind to local network only
var sockets = require('../components/sockets');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '8080'); // use PORT=8080 node CanvasDisplay.js to set port you want to listen to
app.set('port', port);

app.route('/save_data').post(function(req, res, next){
  console.log('got something');
  res.send('I got it!');
});
/**
 * Create HTTP server.
 */
var server = http.createServer(app);
var fileEntryAddr = "0.0.0.0";
var fileEntryPort = 8081;
var socketsOptions = {
    pingTimeout: 5000,
    pingInterval: 30000
};
sockets.bind(server, socketsOptions, fileEntryAddr, fileEntryPort);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, interfaceBindTo);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log("Server on: %s:%s", addr.address, addr.port);
}