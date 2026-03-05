// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');

const io = new Server(http, {
  cors: { origin: '*' }
});

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

// On démarre le serveur
const PORT = 3000;
http.listen(PORT, () => {
  console.log('Serveur sur http://localhost:' + PORT);
});
