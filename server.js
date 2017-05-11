const express = require('express');
const SocketServer = require('ws').Server;
const uuidV4 = require('uuid/v4');

// Set the port to 3001
const PORT = 3001;
const INCOMING_MESSAGE = 'incomingMessage';
const INCOMING_NOTIFICATION = 'incomingNotification';
const INCOMING_USER_INFO = 'incomingUserInfo';
const POST_MESSAGE = 'postMessage';
const POST_NOTIFICATION = 'postNotification';
const COLORS = ['firebrick', 'indigo', 'forestgreen', 'plum'];
const MATCH_REGEX = /https:\S*\.(jpg|png|gif)/gi;
// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });


// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// // the ws parameter in the callback.

function broadcast(data) {
  for(let client of wss.clients) {
    client.send(data);
  }
}

function messageContent(message_content){
  return message_content.replace(MATCH_REGEX, '');
}

function messageColor(client){
  const user_info = USER_COLORS.find(item => item.client === client);
  return user_info.color;
}


function imageURL(message_content){
  const image_found = message_content.match(MATCH_REGEX);
  if(image_found){
    return image_found[0];
  }
  return '';
}

function sendUsersInfo(){
  const user_count = {
      type : INCOMING_USER_INFO,
      content : `${wss.clients.size} user(s) online`
    }
  broadcast(JSON.stringify(user_count));
}

function setUserColor(client){
  const color = COLORS[Math.floor(Math.random()*COLORS.length)];
  USER_COLORS = [...USER_COLORS, {client: client, color: color}];
}

let USER_COLORS  = [];
wss.on('connection', (ws) => {
  console.log('Client connected');
  setUserColor(ws);
  sendUsersInfo();
  ws.on('message', (data) => {
    try{
      let message = JSON.parse(data);
    }catch(error){
      throw new Error(`Unable to parse the data ${error}`);
    }
    switch(message.type){
        case POST_MESSAGE:
          message.id = uuidV4();
          message.type = INCOMING_MESSAGE;
          message.url = imageURL(message.content);
          message.content = messageContent(message.content);
          message.color = messageColor(ws);
          break;
        case POST_NOTIFICATION:
          message.id = uuidV4();
          message.type = INCOMING_NOTIFICATION;
          message.content = message.content;
          break;
        default:
          throw new Error(`Unknown event type ${message.type}`);
      }
    broadcast(JSON.stringify(message));
  });
  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected');
    sendUsersInfo();
  });

});