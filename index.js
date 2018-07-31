const express = require('express');
const path = require('path');
var bodyParser = require("body-parser");
var errorHandler = require("errorhandler");


const PORT = process.env.PORT || 5000;
const app = express();

// --------------------------------------------------------------------
// SET UP PUSHER
// --------------------------------------------------------------------
var Pusher = require("pusher");
var pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER
});

var pusherCallback = function(err, req, res){
  if(err){
    console.log("Pusher error:", err.message);
    console.log(err.stack);
  }
}


// --------------------------------------------------------------------
// SET UP EXPRESS
// --------------------------------------------------------------------

// Parse application/json and application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

// Simple logger
app.use(function(req, res, next){
  console.log("%s %s", req.method, req.url);
  console.log(req.body);
  next();
});

// Error handler
app.use(errorHandler({
  dumpExceptions: true,
  showStack: true
}));

app.use(express.static(path.join(__dirname, 'public')));


// Message proxy
app.post("/message", function(req, res) {

  var socketId = req.body.socketId;
  var channel = req.body.channel;
  var message = req.body.message;

  pusher.trigger(channel, "message", message, socketId, pusherCallback);

  res.send(200);
});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
/*
express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
*/
