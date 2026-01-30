// Vercel Serverless Function - List Keys
const { kv } = require('@vercel/kv');

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

        // Get all key IDs
        const keyIds = await kv.lrange('all_keys', 0, -1);
        const now = Date.now();
        const keys = [];

        // Fetch details for each key
        for (const key of keyIds) {
            const data = await kv.get(`key:${key}`);
            if (data) {
                keys.push({
                    key: key,
                    plan: data.plan,
                    created: data.created,
                    expiry: data.expiry,
                    duration: data.duration,
                    expired: data.expiry < now,
                    daysLeft: Math.ceil((data.expiry - now) / (1000 * 60 * 60 * 24))
                });
            } else {
                // Key id exists in list but not data? Consider deleted or clean up
            }
        }

        return res.status(200).json({ keys });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro interno - Verifique se Vercel KV está configurado' });
    }
};
