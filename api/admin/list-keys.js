// Vercel Serverless Function - List Keys
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
        const { adminPassword } = req.body;

        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

        if (adminPassword !== ADMIN_PASSWORD) {
            return res.status(403).json({ error: 'Senha admin incorreta' });
        }

        const { data: keysData, error } = await supabase
            .from('keys')
            .select('*')
            .order('expiry', { ascending: false });

        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar keys' });
        }

        const now = Date.now();
        const keys = keysData.map(data => {
            const expiry = new Date(data.expiry).getTime();
            return {
                key: data.key,
                plan: data.plan,
                created: data.created_at,
                expiry: expiry,
                duration: data.duration,
                expired: expiry < now,
                daysLeft: Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
            };
        });

        return res.status(200).json({ keys });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro interno' });
    }
};
