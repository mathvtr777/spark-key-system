// Vercel Serverless Function - Create Key
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role for admin writes
const supabase = createClient(supabaseUrl, supabaseKey);

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
        const expiry = new Date(Date.now() + (duration * 24 * 60 * 60 * 1000));

        // Save to Supabase
        const { error } = await supabase
            .from('keys')
            .insert({
                key: key,
                plan: plan || 'Standard',
                expiry: expiry.toISOString(),
                duration: duration,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Supabase Error:', error);
            return res.status(500).json({ error: 'Erro ao salvar no banco' });
        }

        return res.status(200).json({
            success: true,
            key: key,
            expiry: expiry.toISOString()
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro interno' });
    }
};
