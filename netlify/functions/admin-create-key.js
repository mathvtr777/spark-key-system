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

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { duration, plan, adminPassword } = JSON.parse(event.body);

        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

        if (adminPassword !== ADMIN_PASSWORD) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Senha admin incorreta' })
            };
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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                key: key,
                expiry: new Date(expiry).toISOString()
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
