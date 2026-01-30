const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database file path
const DB_FILE = path.join(__dirname, 'keys.json');

// Initialize database if doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ keys: {} }, null, 2));
}

// Helper functions
function readDB() {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// API Routes

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Spark Key Validation API',
        version: '1.0.0'
    });
});

// Validate key
app.post('/api/validate', (req, res) => {
    const { key } = req.body;

    if (!key) {
        return res.status(400).json({
            valid: false,
            message: 'Key não fornecida'
        });
    }

    const db = readDB();
    const keyData = db.keys[key];

    if (!keyData) {
        return res.status(401).json({
            valid: false,
            message: 'Chave inválida ou não encontrada'
        });
    }

    // Check expiration
    const now = Date.now();
    if (keyData.expiry < now) {
        return res.status(401).json({
            valid: false,
            message: 'Chave expirada'
        });
    }

    // Calculate days left
    const daysLeft = Math.ceil((keyData.expiry - now) / (1000 * 60 * 60 * 24));

    // Return success
    res.json({
        valid: true,
        status: 'active',
        plan: keyData.plan || 'Standard',
        credits: 999999999,
        expiry: new Date(keyData.expiry).toISOString(),
        expires_at: new Date(keyData.expiry).toISOString(),
        daysLeft: daysLeft,
        message: `Key válida por mais ${daysLeft} dias`
    });
});

// Admin: Create key
app.post('/api/admin/create-key', (req, res) => {
    const { duration, plan, adminPassword } = req.body;

    // Simple password protection (você pode mudar isso)
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Senha admin incorreta' });
    }

    // Generate random key
    const part = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = `SPK-${part()}-${part()}-${part()}`;

    // Calculate expiry
    const expiry = Date.now() + (duration * 24 * 60 * 60 * 1000);

    // Save to database
    const db = readDB();
    db.keys[key] = {
        expiry: expiry,
        plan: plan || 'Standard',
        created: Date.now(),
        duration: duration
    };
    writeDB(db);

    res.json({
        success: true,
        key: key,
        expiry: new Date(expiry).toISOString()
    });
});

// Admin: List all keys
app.post('/api/admin/list-keys', (req, res) => {
    const { adminPassword } = req.body;

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Senha admin incorreta' });
    }

    const db = readDB();
    const now = Date.now();

    // Filter and format keys
    const keys = Object.entries(db.keys).map(([key, data]) => ({
        key: key,
        plan: data.plan,
        created: data.created,
        expiry: data.expiry,
        duration: data.duration,
        expired: data.expiry < now,
        daysLeft: Math.ceil((data.expiry - now) / (1000 * 60 * 60 * 24))
    }));

    res.json({ keys });
});

// Admin: Delete key
app.post('/api/admin/delete-key', (req, res) => {
    const { key, adminPassword } = req.body;

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (adminPassword !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Senha admin incorreta' });
    }

    const db = readDB();

    if (!db.keys[key]) {
        return res.status(404).json({ error: 'Key não encontrada' });
    }

    delete db.keys[key];
    writeDB(db);

    res.json({ success: true, message: 'Key deletada' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Spark Key API rodando na porta ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
});
