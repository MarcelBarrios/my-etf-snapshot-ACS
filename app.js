// app.js
require('dotenv').config(); // Load variables from .env file
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

app.use(express.static('static'));

// --- In-Memory Data Storage ---
let trackedSymbols = ['VT', 'SPY', 'QQQ'];
let lastPrices = {};

// Function to fetch stock prices from the API
const fetchPrices = async () => {
    console.log('Fetching latest prices...');
    const pricePromises = trackedSymbols.map(async (symbol) => {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const quote = data['Global Quote'];
            if (quote && quote['05. price']) {
                return { symbol: quote['01. symbol'], price: parseFloat(quote['05. price']).toFixed(2) };
            }
        } catch (error) { console.error(`Error fetching ${symbol}:`, error); }
        return null;
    });

    const results = await Promise.all(pricePromises);
    results.forEach(res => { if (res) lastPrices[res.symbol] = res.price; });

    // Broadcast the new prices to ALL connected clients
    io.emit('price_update', lastPrices);
};

// --- Socket.IO Event Handling ---
io.on('connection', (socket) => {
    console.log('A user connected');
    // When a new user connects, send them the current symbols and prices immediately
    socket.emit('initial_data', { symbols: trackedSymbols, prices: lastPrices });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Fetch prices every 60 seconds
setInterval(fetchPrices, 60000);
// Also fetch prices once on server start
fetchPrices();

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});