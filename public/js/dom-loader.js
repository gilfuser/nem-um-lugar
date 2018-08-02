// var object = {
//   synth: {
//     nxfreq: 'freq',
//     nxvol: 'vol',
//     nxmod: 'mod'
//   }
// }

// document.bgColor = "black"

const synth = document.createElement('DIV');

// div.style.height = '100vh';
document.body.appendChild(synth);
synth.id = 'synth';

const freq = document.createElement('DIV');
freq.id = 'freq';
// freq.attribute = 'nexus-ui="dial';
document.getElementById('synth').appendChild(freq);

const vol = document.createElement('DIV');
vol.id = 'vol';
// vol.attribute = 'nexus-ui="dial';
document.getElementById('synth').appendChild(vol);

const mod = document.createElement('DIV');
mod.id = 'mod';
document.getElementById('synth').appendChild(mod);

const slider = document.createElement('DIV');
document.body.appendChild(slider);
slider.id = 'slider';
