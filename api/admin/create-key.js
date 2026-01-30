// Vercel Serverless Function - Create Key
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

        const keyData = {
            expiry: expiry,
            plan: plan || 'Standard',
            created: Date.now(),
            duration: duration
        };

        // Save to Vercel KV
        // Store individual key
        await kv.set(`key:${key}`, keyData);

        // Add to list of all keys
        await kv.lpush('all_keys', key);

        return res.status(200).json({
            success: true,
            key: key,
            expiry: new Date(expiry).toISOString()
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro interno - Verifique se Vercel KV está configurado' });
    }
};
