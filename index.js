const config = {
  app_id: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
};

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const ws = require('ws');

const PORT = process.env.PORT || 5001;
const app = express();

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


// -------------------------------------------------
// SET UP OSC-js.js
// -------------------------------------------------

// const OSC = require('osc-js');
const osc = require('osc');

const udpPort = new osc.UDPPort({
  // This is the port we're listening on.
  localAddress: '0.0.0.0',
  localPort: 54321,

  // This is where sclang is listening for OSC messages.
  remoteAddress: '0.0.0.0',
  remotePort: 57120,
  metadata: true,
});

// Open the socket.
udpPort.open();

// Every second, send an OSC message to SuperCollider
setInterval(() => {
  const msg = {
    address: '/hello/from/oscjs',
    args: [
      {
        type: 'f',
        value: Math.random(),
      },
      {
        type: 'f',
        value: Math.random(),
      },
    ],
  };
  console.log('Sending message', msg.address, msg.args, 'to', `${udpPort.options.remoteAddress}:${udpPort.options.remotePort}`);
  udpPort.send(msg);
}, 1000);

/* const oscoptions = {
  receiver: 'ws', // @param {string} Where messages sent via 'send'
  // method will be delivered to, 'ws' for Websocket clients, 'udp' for udp client
  udpServer: { port: 54321 },
  udpClient: { port: 57120 },
  wsServer: {
    host: '0.0.0.0', // @param {string} Hostname of WebSocket server
    port: 8080, // @param {number} Port of WebSocket server
  },
};
const osc = new OSC({ plugin: new OSC.BridgePlugin(oscoptions) });

osc.on('/hello', (message) => {
  console.log(message.args);
});

osc.open(); // start a WebSocket server on port 8080
*/
// --------------------------------------------------------------------
// SET UP EXPRESS
// --------------------------------------------------------------------

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

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
/*
express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
*/
