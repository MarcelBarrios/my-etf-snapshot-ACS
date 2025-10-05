// static/client.js
const socket = io();

// --- DOM Elements ---
const tickerGrid = document.getElementById('ticker-grid');
const stockInput = document.getElementById('stock-input');
const addStockBtn = document.getElementById('add-stock-btn');

// --- Functions ---
// This function clears and rebuilds the stock display grid
const updateGrid = (symbols, prices) => {
    tickerGrid.innerHTML = ''; // Clear the grid
    symbols.forEach(symbol => {
        const price = prices[symbol] || '...';
        const stockCard = document.createElement('div');
        stockCard.className = 'stock-card';
        stockCard.innerHTML = `
            <div class="symbol">${symbol}</div>
            <div class="price">$${price}</div>
        `;
        tickerGrid.appendChild(stockCard);
    });
};

// --- Socket.IO Event Listeners ---

// Get the initial data when we first connect
socket.on('initial_data', (data) => {
    console.log('Received initial data:', data);
    updateGrid(data.symbols, data.prices);
});

// Get periodic price updates from the server
socket.on('price_update', (prices) => {
    console.log('Received price update:', prices);
    // Update the prices in the existing cards without rebuilding everything
    document.querySelectorAll('.stock-card').forEach(card => {
        const symbol = card.querySelector('.symbol').innerText;
        if (prices[symbol]) {
            card.querySelector('.price').innerText = `$${prices[symbol]}`;
        }
    });
});

// Get an updated list of symbols when someone adds a new one
socket.on('symbols_update', (symbols) => {
    console.log('Symbol list updated:', symbols);
    // Re-render the grid with the new symbol list
    const currentPrices = {};
    document.querySelectorAll('.stock-card').forEach(card => {
        const symbol = card.querySelector('.symbol').innerText;
        const price = card.querySelector('.price').innerText.replace('$', '');
        currentPrices[symbol] = price;
    });
    updateGrid(symbols, currentPrices);
});

// Listen for feedback, like trying to add a duplicate stock
socket.on('action_feedback', (message) => {
    alert(message);
});

// --- Socket.IO Event Emitters ---

// Send a new stock to the server when the 'Add Stock' button is clicked
addStockBtn.addEventListener('click', () => {
    const newSymbol = stockInput.value.trim();
    if (newSymbol) {
        socket.emit('add_stock', newSymbol);
        stockInput.value = '';
    }
});