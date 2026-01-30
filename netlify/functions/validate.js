const fs = require('fs');
const path = require('path');

// Database file path - Netlify persists files in /tmp
const DB_FILE = path.join('/tmp', 'keys.json');

// Initialize database if doesn't exist
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
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
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
        const { key } = JSON.parse(event.body);

        if (!key) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ valid: false, message: 'Key não fornecida' })
            };
        }

        const db = readDB();
        const keyData = db.keys[key];

        if (!keyData) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ valid: false, message: 'Chave inválida ou não encontrada' })
            };
        }

        // Check expiration
        const now = Date.now();
        if (keyData.expiry < now) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ valid: false, message: 'Chave expirada' })
            };
        }

        // Calculate days left
        const daysLeft = Math.ceil((keyData.expiry - now) / (1000 * 60 * 60 * 24));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                valid: true,
                status: 'active',
                plan: keyData.plan || 'Standard',
                credits: 999999999,
                expiry: new Date(keyData.expiry).toISOString(),
                expires_at: new Date(keyData.expiry).toISOString(),
                daysLeft: daysLeft,
                message: `Key válida por mais ${daysLeft} dias`
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
