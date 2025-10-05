// static/client.js
const socket = io();

// Get the initial data when we first connect
socket.on('initial_data', (data) => {
    console.log('Received initial data:', data);
});

// Get periodic price updates from the server
socket.on('price_update', (prices) => {
    console.log('Received price update:', prices);
});