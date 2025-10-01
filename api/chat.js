// /api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "No message provided" });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GOOGLE_API_KEY" });
    }

    // ✅ v1 endpoint + "latest" моделін қолданамыз
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    // Историяны да жібереміз
    const contents = [
      ...history.map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: String(m.content || "") }]
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    const payload = { contents };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // Егер Google қате қайтарса, оны да шығарып жібереміз
    const data = await r.json();
    console.log("Gemini response:", JSON.stringify(data, null, 2));

    if (!r.ok) {
      const errMsg =
        data?.error?.message ||
        `Gemini HTTP ${r.status} ${r.statusText}` ||
        "Unknown error";
      return res.status(200).json({
        answer: `Қате: ${errMsg}`
      });
    }

    // ✅ Жауапты барынша сенімді түрде алу
    let answer = "Кешіріңіз, жауап табылмады.";
    const cand = data?.candidates?.[0];
    const parts = cand?.content?.parts;

    if (Array.isArray(parts) && parts.length) {
      const texts = parts
        .map(p => (typeof p.text === "string" ? p.text : ""))
        .filter(Boolean);
      if (texts.length) {
        answer = texts.join("\n");
      }
    }

    // Егер қауіпсіздікке байланысты блоктаса — хабарлаймыз
    const blockReason =
      cand?.finishReason === "SAFETY" ||
      data?.promptFeedback?.blockReason ||
      cand?.safetyRatings?.some?.(() => false); // орынбасар
    if (!answer || answer.trim() === "") {
      answer =
        data?.promptFeedback?.blockReason
          ? `Қауіпсіздік шектеуі: ${data.promptFeedback.blockReason}`
          : "Кешіріңіз, жауап табылмады.";
    }

    return res.status(200).json({ answer });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
