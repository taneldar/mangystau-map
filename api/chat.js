// /api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Missing GOOGLE_API_KEY' });
    }

    // Google Gemini API шақыру
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        ...history.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ]
    };

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await r.json();

    const answer =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') ||
      'Кешіріңіз, жауап табылмады.';

    res.status(200).json({ answer });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
