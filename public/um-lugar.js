// Initialise DataChannel.js
let datachannel = new DataChannel();

// Set the userid based on what has been defined by DataChannel
// https://github.com/muaz-khan/WebRTC-Experiment/tree/master/DataChannel#use-custom-user-ids
datachannel.userid = window.userid;

// Pusher.logToConsole = true

// Open a connection to Pusher
const pusher = new Pusher('5b910001398e4d3a968e', {
  cluster: 'eu',
  // encrypted: true
});

// Storage of Pusher connection socket ID
let socketId;

Pusher.log = (message) => {
  if (window.console && window.console.log) {
    window.console.log(message);
  }
};

// Monitor Pusher connection state
pusher.connection.bind('state_change', (states) => {
  switch (states.current) {
    case 'connected':
      socketId = pusher.connection.socket_id;
      break;
    case 'disconnected':
    case 'failed':
    case 'unavailable':
      break;
  }
});

// -------------------------------------------------------------
// SET CUSTOM PUSHER SIGNALING CHANNEL /////////////////////////
// https://github.com/muaz-khan/WebRTC-Experiment/blob/master/Signaling.md

datachannel.openSignalingChannel = (config) => {
  const channel = config.channel || this.channel || 'default-channel';
  let xhrErrorCount = 0;

  let socket = {
    send(message) {
      $.ajax({
        type: 'POST',
        url: '/message', // Node.js & Ruby (Sinatra)
        // url: "_servers/php/message.php", // PHP
        data: {
          socketId,
          channel,
          message,
        },
        timeout: 1000,
        success: (data) => {
          xhrErrorCount = 0;
        },
        error: (xhr, type) => {
          // Increase XHR error count
          xhrErrorCount += 1

          // Stop sending signaller messages if it's down
          if (xhrErrorCount > 5) {
            console.log('Disabling signaller due to connection failure');
            datachannel.transmitRoomOnce = true;
          }
        },
      });
    },
    channel,
  };
  // Subscribe to Pusher signalling channel
  let pusherChannel = pusher.subscribe(channel);
  // Call callback on successful connection to Pusher signalling channel
  pusherChannel.bind('pusher:subscription_succeeded', () => {
    if (config.callback) config.callback(socket);
  });
  // Proxy Pusher signaller messages to DataChannel
  pusherChannel.bind('message', (message) => {
    config.onmessage(message);
  });
  return socket;
};
// ------------------------------------------------------------

// ------------------------------------------------------------
// ---------- OSC STUFF ---------------------------------------
// ------------------------------------------------------------
/*  const options = {
  udpServer: { port: 54321 },
  udpClient: { port: 57120 },
  wsServer: {
    host: '0.0.0.0', // @param {string} Hostname of WebSocket server
    port: 8080, // @param {number} Port of WebSocket server
  },
  wsClient: {
    host: '0.0.0.0',
    port: 8080,
  },
};

let osc = new OSC(options);
osc.open(); // connect by default to ws://localhost:8080

document.getElementById('send-osc').addEventListener('click', () => {
  let message = new OSC.Message('/test/random', Math.random());
  osc.send(message);
});
*/
// -----------------------------------------------------------


const cleanChannelName = channel => channel.replace(/(\W)+/g, '-').toLowerCase();

const channelInput = document.querySelector('.demo-chat-channel-input');
const createChannelBtn = document.querySelector('.demo-chat-create');
const joinChannelBtn = document.querySelector('.demo-chat-join');

const disableConnectInput = () => {
  channelInput.disabled = true;
  createChannelBtn.disabled = true;
  joinChannelBtn.disabled = true;
};

const onCreateChannel = () => {
  let channelName = cleanChannelName(channelInput.value);
  if (!channelName) {
    console.log('No channel name given');
    return;
  }
  disableConnectInput();
  datachannel.open(channelName);
};

const onJoinChannel = () => {
  let channelName = cleanChannelName(channelInput.value);
  if (!channelName) {
    console.log('No channel name given');
    return;
  }
  disableConnectInput();
  // Search for existing data channels
  datachannel.connect(channelName);
};

const messageList = document.querySelector('.demo-chat-messages');

const addMessage = (message, userId, self) => {
  let messages = messageList.getElementsByClassName('list-group-item');
  // Check for any messages that need to be removed
  let messageCount = messages.length;
  for (let i = 0; i < messageCount; i += 1) {
    let msg = messages[i];
    if (msg.dataset.remove === 'true') {
      messageList.removeChild(msg);
    }
  }
  let newMessage = document.createElement('li');
  newMessage.classList.add('list-group-item');
  if (self) {
    newMessage.classList.add('self');
    newMessage.innerHTML = `<span class='badge'>You</span><p>${message}</p>`;
  } else {
    newMessage.innerHTML = `<span class='badge'>${userId}</span><p>${message}</p>`;
  }
  messageList.appendChild(newMessage);
};

const messageInput = document.querySelector('.demo-chat-message-input');

const onSendMessage = () => {
  let message = messageInput.value;
  if (!message) {
    console.log('No message given');
    return;
  }
  datachannel.send(message);
  addMessage(message, window.userid, true);
  messageInput.value = '';
};

const onMessageKeyDown = (event) => {
  if (event.keyCode === 13) {
    onSendMessage();
  }
};

messageInput.addEventListener('keydown', onMessageKeyDown);

const sendBtn = document.querySelector('.demo-chat-send');


// Set up DOM listeners
createChannelBtn.addEventListener('click', onCreateChannel);
joinChannelBtn.addEventListener('click', onJoinChannel);
sendBtn.addEventListener('click', onSendMessage);

// Set up DataChannel handlers
datachannel.onopen = (userId) => {
  document.querySelector('.demo-connect').classList.add('inactive');
  document.querySelector('.demo-chat').classList.remove('inactive');
  messageInput.focus();
};

datachannel.onmessage = (message, userId) => {
  addMessage(message, userId);
};
