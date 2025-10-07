// app.js - Commit 5 (Final)
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const mailgunTransport = require('nodemailer-mailgun-transport');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- API and Email Setup ---
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const mailgunAuth = { auth: { api_key: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN } };
const emailTransporter = nodemailer.createTransport(mailgunTransport(mailgunAuth));

app.use(express.static('static'));

// --- In-Memory Data Storage ---
let trackedSymbols = ['VT', 'SPY', 'QQQ'];
let lastPrices = {};
let priceAlerts = []; // { symbol, price, email, triggered }

// --- Core Functions ---
// Function to send the price alert email
const sendAlertEmail = (alert) => {
    console.log(`Sending price alert for ${alert.symbol} to ${alert.email}`);

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: alert.email,
        subject: `Price Alert for ${alert.symbol}!`,
        // The plain text version for email clients that don't support HTML
        text: `This is an automated alert from ETF Snapshot. The price for ${alert.symbol} has reached your target of $${alert.price}. The current price is $${lastPrices[alert.symbol]}.`,
        // styled HTML version of the email
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #0d6efd; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">Price Alert Triggered!</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Hello,</p>
                    <p>This is an automated alert from your Real-Time ETF Ticker.</p>
                    <p>The price for <strong>${alert.symbol}</strong> has reached your target.</p>
                    <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px 0;">Your Target Price:</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold;">$${parseFloat(alert.price).toFixed(2)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px 0;">Current Price:</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 20px; color: #198754;">$${lastPrices[alert.symbol]}</td>
                        </tr>
                    </table>
                </div>
                <div style="background-color: #f8f9fa; color: #6c757d; padding: 15px; text-align: center; font-size: 12px;">
                    <p style="margin: 0;">Real-Time Financial Updates</p>
                </div>
            </div>
        `
    };

    emailTransporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('Error sending email:', error);
        }
        console.log('Email sent:', info.response);
    });
};

const checkPriceAlerts = () => {
    priceAlerts.forEach((alert) => {
        if (!alert.triggered && lastPrices[alert.symbol] && parseFloat(lastPrices[alert.symbol]) >= parseFloat(alert.price)) {
            sendAlertEmail(alert);
            alert.triggered = true;
        }
    });
    priceAlerts = priceAlerts.filter(alert => !alert.triggered);
};

const fetchPrices = async () => {
    const pricePromises = trackedSymbols.map(async (symbol) => {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const quote = data['Global Quote'];
            if (quote && quote['05. price']) { return { symbol: quote['01. symbol'], price: parseFloat(quote['05. price']).toFixed(2) }; }
        } catch (error) { console.error(`Error fetching ${symbol}:`, error); }
        return null;
    });
    const results = await Promise.all(pricePromises);
    results.forEach(res => { if (res) lastPrices[res.symbol] = res.price; });
    io.emit('price_update', lastPrices);
    checkPriceAlerts();
};

// --- Socket.IO Event Handling ---
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.broadcast.emit('user_connected');

    socket.emit('initial_data', { symbols: trackedSymbols, prices: lastPrices });
    socket.on('add_stock', (newSymbol) => {
        const symbol = newSymbol.toUpperCase();
        if (!trackedSymbols.includes(symbol)) {
            trackedSymbols.push(symbol);
            io.emit('symbols_update', trackedSymbols);
            fetchPrices();
        } else {
            socket.emit('action_feedback', `The symbol ${symbol} is already being tracked.`);
        }
    });
    socket.on('set_alert', (data) => {
        priceAlerts.push({ symbol: data.symbol.toUpperCase(), price: data.price, email: data.email, triggered: false });
        socket.emit('alert_confirmation', `Alert set for ${data.symbol} at $${data.price}.`);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected');
        socket.broadcast.emit('user_disconnected');
    });
});

setInterval(fetchPrices, 60000);
fetchPrices();
const PORT = 3000;
server.listen(PORT, () => console.log(`Server is listening on http://localhost:${PORT}`));