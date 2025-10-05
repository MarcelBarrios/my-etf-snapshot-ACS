// static/client.js
const socket = io();

// Listen for the 'feedback' event from the server
socket.on('feedback', (message) => {
    console.log('Server says:', message);
});