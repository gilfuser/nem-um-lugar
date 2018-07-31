const config = {
  app_id: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
};

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');

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
