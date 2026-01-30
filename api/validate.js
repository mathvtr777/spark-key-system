// Vercel Serverless Function - Validate Key
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({
                valid: false,
                message: 'Key não fornecida'
            });
        }

        // Get key from Supabase
        const { data: keyData, error } = await supabase
            .from('keys')
            .select('*')
            .eq('key', key)
            .single();

        if (error || !keyData) {
            return res.status(401).json({
                valid: false,
                message: 'Chave inválida ou não encontrada'
            });
        }

        // Check expiration
        const now = Date.now();
        const expiry = new Date(keyData.expiry).getTime();

        if (expiry < now) {
            return res.status(401).json({
                valid: false,
                message: 'Chave expirada'
            });
        }

        // Calculate days left
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        return res.status(200).json({
            valid: true,
            status: 'active',
            plan: keyData.plan || 'Standard',
            credits: 999999999,
            expiry: new Date(expiry).toISOString(),
            expires_at: new Date(expiry).toISOString(),
            daysLeft: daysLeft,
            message: `Key válida por mais ${daysLeft} dias`
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro interno' });
    }
};
