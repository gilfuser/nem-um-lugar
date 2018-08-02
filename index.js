const config = {
  app_id: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
};

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


const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');

const app = express();
const http = require('http').Server(app);
// const ws = require('ws');

const PORT = process.env.PORT || 5001;
http.listen(PORT, () => { console.log(`Server started on port ${PORT}`); });

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

app.get('/', (req, res) => { // from oscchat project
  res.sendFile('/public/index.html');
});

// Message proxy
app.post('/message', (req, res) => {
  const { socketId, channel, message } = req.body;
  // let channel = req.body.channel;
  // let message = req.body.message;
  pusher.trigger(channel, 'message', message, socketId, pusherCallback);
  res.sendStatus(200);
});

// app.listen(PORT, () => console.log(`Express listening on ${PORT}`));

// OSC EXPRESS

// app.use('/nexusui', express.static(path.join(__dirname, '/node_modules/nexusui/dist/')));

// This call back just tells us that the server has started
function listen() {
  let host = http.address().address;
  let port = http.address().port;
  console.log(`http server listening at http://${host}:${port}`);
}

// ////////////// WebSocket Portion ///////////////////////

const io = require('socket.io').listen(http);
const osc = require('node-osc');

let oscServer;
let oscClient;
let isConnected = false;

// This will run for each individual user that connects
io.sockets.on('connection', (socket) => {
  console.log(`We have a new client: ${socket.id}`);
  // config OSC stuff
  socket.on('config', (obj) => {
    isConnected = true;
    oscServer = new osc.Server(obj.server.port, obj.server.host);
    oscClient = new osc.Client(obj.client.host, obj.client.port);
    oscClient.send('/status', `${socket} connected`);
    oscServer.on('message', (msg, rinfo) => {
      socket.emit('message', msg);
      // console.log(`rinfo: ${rinfo.value}`);
    });
    socket.emit('connected', 1);
  });

  socket.on('message', (obj) => {
    oscClient.send(obj);
    // console.log(obj);
  });

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
