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
        const { adminPassword } = JSON.parse(event.body);

        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

        if (adminPassword !== ADMIN_PASSWORD) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Senha admin incorreta' })
            };
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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ keys })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
