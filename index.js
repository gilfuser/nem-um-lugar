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
const os = require('os');

let getIPAddresses = () => {
  let interfaces = os.networkInterfaces();
  let ipAddresses = [];

  for (let deviceName in interfaces) {
    if (interfaces.hasOwnProperty(deviceName)) {
      let addresses = interfaces[deviceName];
      for (let i = 0; i < addresses.length; i += 1) {
        let adressInfo = addresses[i];
        if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
          ipAddresses.push(addressInfo.address);
        }
      }
    }
  }
  return ipAddresses;
};

const udp = new osc.UDPPort({
  // This is the port we're listening on.
  localAddress: '0.0.0.0',
  localPort: 54321,
  // This is where sclang is listening for OSC messages.
  remoteAddress: '0.0.0.0',
  remotePort: 57120,
  metadata: true,
});

// Open the socket.

// check incoming osc messages
udp.on('ready', (message, timetag, info) => {
  let ipAddresses = getIPAddresses();
  console.log('Listening for OSC over UDP.');
  ipAddresses.forEach((address) => {
    console.log(' Host:', `${address}, Port:`, udp.options.localPort);
  });
  console.log(message);
  console.log('To start the demo, go to http://localhost:8081 in your web browser.');
});

udp.open();

// Every second, send an OSC message to SuperCollider
udp.on('ready', () => {
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
    console.log('Sending message', msg.address, msg.args, 'to', `${udp.options.remoteAddress}:${udp.options.remotePort}`);
    udp.send(msg);
  }, 1000)
});

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

// OSC EXPRESS

// const apposc = express();
const server = app.listen(PORT);
const wss = new ws.Server({
  server,
});

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

/*
express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
*/
