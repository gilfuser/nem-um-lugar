const config = {
  app_id: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
};

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const osc = require('node-osc');

// --------------------------------------------------------------------
// SET UP PUSHER
// --------------------------------------------------------------------
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: config.app_id,
  key: config.key,
  secret: config.secret,
  cluster: 'eu',
  encrypted: true,
});
// console.log(pusher.app_id);

const pusherCallback = (err, req, res) => {
  if (err) {
    console.log('Pusher error:', err.message);
    console.log(err.stack);
  }
};

// --------------------------------------------------------------------
// SET UP SERVERS
// --------------------------------------------------------------------

const app = express();
const server = require('http').Server(app);
// const ws = require('ws');

const PORT = process.env.PORT || 5001;
server.listen(PORT);
console.log(`Server started on port ${PORT}`);

// Parse application/json and application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(bodyParser.json());

// Simple logger
app.use((req, res, next) => {
  console.log('%s %s', req.method, req.url);
  console.log(req.body);
  next();
});

// Error handler
app.use(errorHandler({
  dumpExceptions: true,
  showStack: true,
}));

app.use(express.static(path.join(__dirname, 'public')));

// Message proxy
app.post('/message', (req, res) => {
  const { socketId, channel, message } = req.body;
  // let channel = req.body.channel;
  // let message = req.body.message;
  pusher.trigger(channel, 'message', message, socketId, pusherCallback);
  res.sendStatus(200);
});

// app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// OSC EXPRESS
/*
app.get('/', (req, res) => {
  res.sendFile('/public/index.html');
});
*/
app.use('/nexusui', express.static(path.join(__dirname, '/node_modules/nexusui/dist/')));

// This call back just tells us that the server has started
function listen() {
  let host = server.address().address;
  let port = server.address().port;
  console.log(`Example app listening at http://${host}:${port}`);
}
// const apposc = express();
// const server = apposc.listen(8888);
// let wss = new ws.Server({
// server,
// });

// ////////////// WebSocket Portion ///////////////////////

const io = require('socket.io').listen(server);
// const osc = require('node-osc');
let oscServer;
let oscClient;
let isConnected = false;
/*
apposc.use(express.static(path.join(__dirname, 'public')));
// apposc.use('/', express.static(appResources));
wss.on('connection', (socket) => {
  console.log('A Web Socket connection has been established!');
  let socketPort = new osc.WebSocketPort({
    socket,
  });

  let relay = new osc.Relay(udp, socketPort, {
    raw: true
  });
});
*/

// This will run for each individual user that connects
io.sockets.on('connection', (socket) => {
  console.log(`We have a new client: ${socket.id}`);
  // config OSC stuff
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
  /*
  socket.on("message", function (obj) {
    oscClient.send.apply(oscClient, obj);
    console.log(obj);
  });
  */
  socket.on('disconnect', () => {
    if (isConnected) {
      oscServer.kill();
      oscClient.kill();
      console.log('Client has disconnected');
    }
  });
});

/*
express()
.use(express.static(path.join(__dirname, 'public')))
.set('views', path.join(__dirname, 'views'))
.set('view engine', 'ejs')
.get('/', (req, res) => res.render('pages/index'))
.listen(PORT, () => console.log(`Listening on ${ PORT }`))
*/
