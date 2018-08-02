var osc = require('node-osc');
var io = require('socket.io')(8081);


let oscServer;
let oscClient;

let isConnected = false;


io.sockets.on('connection', (socket) => {
  console.log('connection');
  socket.on('config', (obj) => {
    isConnected = true;
    oscServer = new osc.Server(obj.server.port, obj.server.host);
    oscClient = new osc.Client(obj.client.host, obj.client.port);
    oscClient.send('/status', `${socket.sessionId} connected`);
    oscServer.on('message', (msg, rinfo) => {
      socket.emit('message', msg);
    });
    socket.emit('connected', 1);
  });
  socket.on('message', (obj) => {
    oscClient.send(...obj);
  });
  socket.on('disconnect', () => {
    if (isConnected) {
      oscServer.kill();
      oscClient.kill();
    }
  });
});
