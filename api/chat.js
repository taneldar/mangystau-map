export default async function handler(req, res) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GOOGLE_API_KEY" });
    }

    // 🔹 Модельдер тізімі тек v1beta арқылы қолжетімді
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const r = await fetch(url);
    const data = await r.json();

    res.status(200).json(data);
  } catch (e) {
    console.error("ListModels error:", e);
    res.status(500).json({ error: "Server error" });
  }
}
