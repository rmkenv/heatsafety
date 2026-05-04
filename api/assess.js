const Anthropic = require("@anthropic-ai/sdk");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { temp, humidity, aqi, wbTemp, city } = req.body || {};

  if (temp == null || humidity == null || aqi == null || wbTemp == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  function aqiLabel(v) {
    if (v <= 50) return "Good";
    if (v <= 100) return "Moderate";
    if (v <= 150) return "Unhealthy for sensitive groups";
    if (v <= 200) return "Unhealthy";
    if (v <= 300) return "Very Unhealthy";
    return "Hazardous";
  }

  const prompt = `You are an outdoor safety expert. Current conditions${city ? " in " + city : ""}:
- Temperature: ${Math.round(temp)}°F
- Relative humidity: ${Math.round(humidity)}%
- AQI: ${Math.round(aqi)} (${aqiLabel(aqi)})
- Wet bulb temperature: ${Math.round(wbTemp)}°F

In 2-3 concise sentences, assess outdoor safety for a typical healthy adult. Note specific risks and give one practical recommendation. Be direct.`;

  try {
    const client = new Anthropic({
      baseURL: "https://ollama.com",
      apiKey: process.env.OLLAMA_API_KEY || "ollama",
    });

    const message = await client.messages.create({
      model: "gpt-oss:20b",
      max_tokens: 250,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content?.find((b) => b.type === "text")?.text ||
      "Unable to assess conditions.";
    return res.status(200).json({ assessment: text });
  } catch (err) {
    console.error("Ollama error:", err);
    return res.status(500).json({ error: err.message });
  }
}
