const https = require("https");

function aqiLabel(v) {
  if (v <= 50)  return "Good";
  if (v <= 100) return "Moderate";
  if (v <= 150) return "Unhealthy for sensitive groups";
  if (v <= 200) return "Unhealthy";
  if (v <= 300) return "Very Unhealthy";
  return "Hazardous";
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { temp, humidity, aqi, wbTemp, city, lang } = req.body || {};
  const respondIn = lang === "es" ? "Spanish" : "English";

  if (temp == null || humidity == null || aqi == null || wbTemp == null)
    return res.status(400).json({ error: "Missing required fields" });

  const prompt = `You are an outdoor safety expert. Current conditions${city ? " in " + city : ""}:
- Temperature: ${Math.round(temp)}°F
- Relative humidity: ${Math.round(humidity)}%
- AQI: ${Math.round(aqi)} (${aqiLabel(aqi)})
- Wet bulb temperature: ${Math.round(wbTemp)}°F

Respond in ${respondIn}. In 2-3 concise sentences, assess outdoor safety for a typical healthy adult. Note specific risks and give one practical recommendation. Be direct.`;

  const payload = JSON.stringify({
    model: "gpt-oss:20b-cloud",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 250,
    stream: false,
  });

  const apiKey = process.env.OLLAMA_API_KEY || "";

  try {
    const text = await new Promise((resolve, reject) => {
      const options = {
        hostname: "ollama.com",
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Authorization: `Bearer ${apiKey}`,
        },
      };

      const request = https.request(options, (response) => {
        let data = "";
        response.on("data", (chunk) => (data += chunk));
        response.on("end", () => {
          if (response.statusCode >= 400) {
            reject(new Error(`Ollama API error ${response.statusCode}: ${data}`));
            return;
          }
          try {
            const json = JSON.parse(data);
            resolve(json.choices?.[0]?.message?.content || "No response");
          } catch (e) {
            reject(new Error("Failed to parse response: " + data));
          }
        });
      });

      request.on("error", reject);
      request.write(payload);
      request.end();
    });

    return res.status(200).json({ assessment: text });
  } catch (err) {
    console.error("Ollama error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
