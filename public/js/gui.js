
// const synth2 = new Nexus.Rack('#synth2');
// var socket = io.connect();
// socket.on('freq', newDrawing);
/*
synth2.freq = new Nexus.Dial('#freq');
synth2.vol = new Nexus.Dial('#vol');
synth2.mod = new Nexus.Dial('#mod');

// socket.on('freq', freqVal);
synth2.freq.value = 0.25;
synth2.vol.value = 0.5;
synth2.mod.value = 0.75;
*/
// synth2.freq.on('change',function(freqVal) {
//   socket.emit('freq', freqVal);
// });

function receiveOsc(address, msg) {
  console.log(`received OSC: ${address}, ${msg}`);
}

const socket = io.connect();

function sendOsc(address, msg) {
  socket.emit('message', [address].concat(msg));
}

// sendOsc('/asdasd', 0.888)

const slider = new Nexus.Slider('#slider');
slider.on('change', (msg) => {
  // console.log(value);
  // sendOsc('/slider', msg)
  socket.emit('message', ['/test'].concat(msg));
  // console.log(msg);
});

function setupOsc(oscPortIn, oscPortOut) {
  console.log(`osc port-in is ${oscPortIn}`);
  // const socketio = io.connect('http://127.0.0.1:5000', { port: 5000, rememberTransport: false });
  socket.on('connect', () => {
    socket.emit('config', {
      server: { port: oscPortIn, host: '127.0.0.1' },
      client: { port: oscPortOut, host: '127.0.0.1' },
    });
  });
  // check connection
  if (socket !== undefined) {
    console.log(`connected to socket: '${socket}`);
  } else {
    console.log('socket is undefined');
  }

  socket.on('message', (msg) => {
    if (msg[0] === '#bundle') {
      for (let i = 2; i < msg.length; i += 1) {
        receiveOsc(msg[i][0], msg[i].splice(1));
      }
    } else {
      receiveOsc(msg[0], msg.splice(1));
    }
  });
}

setupOsc(3333, 57120);
