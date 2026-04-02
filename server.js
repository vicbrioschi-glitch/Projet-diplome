

// server.js
var express = require("express");
var app = express();

const PORT = '3000';
server = app.listen(PORT);
console.log(`Node server is running on ${PORT}`);
console.log('¯\\_(ツ)_/¯');

var socket = require("socket.io");
var io = socket(server);


// On sert les fichiers du dossier "public"
app.use(express.static('public'));

// Quand un client se connecte
io.on('connection', (socket) => {
  console.log('Nouveau client connecté :', socket.id);

  // On écoute les messages venant de l'émetteur
  socket.on('messageFromSender', (data) => {
    console.log('Données reçues du sender :', data);

    // On renvoie à tous les autres clients (broadcast)
    socket.broadcast.emit('messageFromServer', data);
  });
});

