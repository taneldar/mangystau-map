export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history = [] } = req.body || {};
    if (!message) return res.status(400).json({ error: "No message provided" });

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing GOOGLE_API_KEY" });

    // 🔹 Ескі "gemini-pro" моделін қолданамыз
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

    const contents = [
      ...history.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: String(m.content || "") }]
      })),
      { role: "user", parts: [{ text: String(message) }] }
    ];

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents })
    });

    const data = await r.json();
    console.log("Gemini response:", JSON.stringify(data, null, 2));

    if (!r.ok) {
      return res.status(200).json({ answer: `Қате: ${data?.error?.message || "API error"}` });
    }

    let answer = "Кешіріңіз, жауап табылмады.";
    const parts = data?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts) && parts.length) {
      const texts = parts.map(p => p.text || "").filter(Boolean);
      if (texts.length) answer = texts.join("\n");
    }

    res.status(200).json({ answer });
  } catch (e) {
    console.error("API error:", e);
    res.status(500).json({ error: "Server error" });
  }
}
