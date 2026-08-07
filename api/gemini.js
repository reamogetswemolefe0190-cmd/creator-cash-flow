// ==========================================================================
// Creator Cash Flow - Gemini 1.5 Flash Serverless Proxy Endpoint
// Compatible with Vercel Serverless Functions & Netlify Functions
// ==========================================================================

module.exports = async (req, res) => {
    // Enable CORS for frontend requests
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(200).json({ 
            fallback: true, 
            message: 'Environment variable GEMINI_API_KEY not configured on server. Utilizing CCF Edge AI fallback.' 
        });
    }

    try {
        const { prompt, systemContext } = req.body || {};
        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt in request body.' });
        }

        const defaultSystemContext = systemContext || 'You are CCF Creator Intelligence, an expert financial advisor for modern creators. Provide concise, highly actionable 2-3 sentence financial guidance answering the user prompt directly.';

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: defaultSystemContext },
                        { text: prompt }
                    ]
                }]
            })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ text: aiText, source: 'Gemini 1.5 Flash (Production Proxy)' });
        } else {
            return res.status(200).json({ fallback: true, error: 'Unexpected API response structure', raw: data });
        }
    } catch (error) {
        console.error('[GEMINI PROXY ERROR]', error);
        return res.status(200).json({ fallback: true, error: error.message });
    }
};
