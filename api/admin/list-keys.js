// Vercel Serverless Function - List Keys
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

        return res.status(200).json({ keys });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
