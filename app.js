// app.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('static'));

// --- Socket.IO Event Handling ---
io.on('connection', (socket) => {
    console.log('A user connected via WebSocket');

    // When a user connects, send a welcome message back to that specific user
    socket.emit('feedback', 'You are connected to the server!');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});


const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});