// Vercel Serverless Function - Create Key
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join('/tmp', 'keys.json');

function initDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ keys: {} }, null, 2));
    }
}

function readDB() {
    initDB();
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { duration, plan, adminPassword } = req.body;

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

        return res.status(200).json({
            success: true,
            key: key,
            expiry: new Date(expiry).toISOString()
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
