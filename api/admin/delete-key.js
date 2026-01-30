// Vercel Serverless Function - Delete Key
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
        const { key, adminPassword } = req.body;

        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

        if (adminPassword !== ADMIN_PASSWORD) {
            return res.status(403).json({ error: 'Senha admin incorreta' });
        }

        // Delete key data
        await kv.del(`key:${key}`);

        // Remove from list
        await kv.lrem('all_keys', 0, key);

        return res.status(200).json({ success: true, message: 'Key deletada' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro interno - Verifique se Vercel KV está configurado' });
    }
};
