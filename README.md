# Real-Time Financial Ticker

## 1. Team Members
* Marcel Barrios

## 2. App Description
This application is a real-time financial ticker that displays live price updates for a list of Exchange-Traded Funds (ETFs) or stocks. The frontend is a single-page application that connects to a Node.js backend via WebSockets. Users can see a list of tracked symbols, watch their prices update automatically every minute, and add new symbols to the ticker for everyone to see.

The project also includes two additional features:
1.  **Price Alerts:** Users can set a target price for a specific symbol and provide their email. When the stock's price reaches the target, the server automatically sends them an email notification.
2.  **Live User Count:** The application displays a temporary notification to all users whenever another user connects or disconnects, creating a more interactive and live experience.

## 3. Justification for Using WebSockets
WebSockets are the ideal technology for this application due to the requirement for real-time, bidirectional communication between the server and all connected clients.

* **Server-Sent Updates:** The primary function of the app is to "push" price updates from the server to the client without the client having to constantly ask for them. Traditional HTTP polling would be inefficient and slow. WebSockets allow the server to instantly broadcast new price data to every user the moment it becomes available.
* **Low Latency:** For financial data, low latency is key. WebSockets provide a persistent, low-overhead connection, ensuring that updates are delivered as quickly as possible.
* **Bidirectional Communication:** The "Add Stock" and "Set Price Alert" features require the client to send data to the server. WebSockets handle this client-to-server communication over the same persistent connection, making the interaction seamless and fast.

## 4. Labeled Mockup & Event Interaction

This mockup shows the user interface and labels the key WebSocket events that trigger interactions.

+-----------------------------------------------------------------+
|                                                                 |
|                  Real-Time Financial Updates                    |
|           Prices update automatically every minute.             |
|                                                                 |
| +-------------------------------------------------------------+ |
| |  +---------+   +---------+   +---------+   +---------+      | |
| |  |   VT    |   |   SPY   |   |   QQQ   |   |  AAPL   |      | |
| |  | $91.43  |   | $510.25 |   | $480.10 |   |  $...   |      | |
| |  +---------+   +---------+   +---------+   +---------+      | |
| |                                                             | |
| +-------------------------------------------------------------+ |
|      |                                                        |
|      <-- (2) Event: 'price_update' (Server -> Client)          |
|          Updates all prices every 60 seconds.                 |
|                                                                 |
| +-------------------------------------------------------------+ |
| |                               |                             | |
| |    Add Stock to Ticker        |      Set a Price Alert      | |
| |   [      AAPL      ] (Input)  |     [      SPY      ]       | |
| |   [   Add Stock   ] (Button)  |     [      520      ]       | |
| |           ^                   |     [ you@email.com ]       | |
| |           |                   |     [   Set Alert   ]       | |
| |           |                   |              ^              | |
| |           |                   |              |              | |
| |  (3) Event: 'add_stock'       |   (4) Event: 'set_alert'    | |
| |      (Client -> Server)       |       (Client -> Server)    | |
| |                               |                             | |
| +-------------------------------------------------------------+ |
|                                                                 |
+-----------------------------------------------------------------+
|                                                                 |
|  +---------------------------+                                  |
|  | A new user has connected! | (Notification)                   |
|  +---------------------------+                                  |
|       ^                                                         |
|       |                                                         |
|       (5) Event: 'user_connected' (Server -> Client)            |
|           Appears for 5 seconds when another user joins.        |
|                                                                 |


**Event Interaction Details:**

1.  **`connection` (Initial Load):** When a user first opens the page, the client connects to the server. The server responds by sending an `initial_data` event, which contains the current list of symbols and prices to populate the grid.
2.  **`price_update` (Server -> Client):** Every 60 seconds, the server fetches new prices and broadcasts them to all clients with this event. The client-side JavaScript listens for this event and updates the dollar values in the stock cards.
3.  **`add_stock` (Client -> Server):** When a user types a symbol and clicks "Add Stock," the client emits this event with the symbol name. The server receives it, adds the symbol to its master list, and then broadcasts a `symbols_update` event to all clients so their grids update with the new stock card.
4.  **`set_alert` (Client -> Server):** When a user fills out the alert form and clicks "Set Alert," the client emits this event with the symbol, target price, and email address. The server adds this to its list of alerts to check.
5.  **`user_connected` / `user_disconnected` (Server -> Client):** When one user connects or disconnects, the server broadcasts this event to all *other* clients, causing the temporary notification to appear.

## 5. How to Install and Run the App

### Prerequisites
* Node.js (v18 or newer recommended)
* An API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
* A free account and API credentials from [Mailgun](https://www.mailgun.com/)

### Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd real-time-ticker
    ```

2.  **Install dependencies:**
    Open your terminal in the project directory and run:
    ```bash
    npm install
    ```

3.  **Create the environment file:**
    Create a file named `.env` in the root of the project and add your secret keys. It should look like this:
    ```
    # .env file

    ALPHA_VANTAGE_API_KEY=YOUR_ALPHA_VANTAGE_KEY
    
    # Mailgun Configuration
    MAILGUN_API_KEY=key-YOUR_MAILGUN_API_KEY
    MAILGUN_DOMAIN=sandbox-YOUR_MAILGUN_DOMAIN.mailgun.org
    EMAIL_FROM="ETF Ticker Alerts <alerts@YOUR_MAILGUN_DOMAIN>"
    ```

4.  **Authorize your email with Mailgun:**
    Since this project uses a Mailgun sandbox, you must authorize any email address you want to send alerts to.
    * Log in to your Mailgun account.
    * Go to **Sending > Domains** and click on your sandbox domain.
    * In the "Authorized Recipients" box, add your email address and follow the verification steps.

### Running the Application

1.  **Start the server:**
    ```bash
    node app.js
    ```

2.  **Open the application:**
    Open your web browser and navigate to `http://localhost:3000`.