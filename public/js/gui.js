
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

function sendOsc(address, msg) {
  socket.emit('message', [address].concat(msg));
}
/*
const slider2 = new Nexus.slider('#slider');
slider2.on('change',(msg) => {
  // console.log(value);
  socket.emit('message', msg);
  // console.log(msg);
});
*/

function setupOsc(oscPortIn, oscPortOut) {
  console.log(`osc port-in is ${oscPortIn}`);
  const socket = io.connect('http://127.0.0.1:8081', { port: 8081, rememberTransport: false });
  socket.on('connect', () => {
    socket.emit('config', {
      server: { port: oscPortIn, host: '0.0.0.0' },
      client: { port: oscPortOut, host: '0.0.0.0' },
    });
  });
  // check connection
  if (socket !== undefined) {
    console.log(`connected to socket: '${socket.value}`);
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
