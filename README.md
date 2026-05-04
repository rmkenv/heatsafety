# Outdoor Safety Monitor

Real-time outdoor safety dashboard combining temperature, air quality (AQI), and wet bulb temperature with an AI-generated safety assessment powered by Ollama Cloud.

## Stack

| Layer | Service |
|---|---|
| Weather & humidity | [Open-Meteo](https://open-meteo.com) (free, no key) |
| Air quality (US AQI) | [Open-Meteo Air Quality](https://open-meteo.com) (free, no key) |
| Wet bulb calculation | Stull (2011) formula, client-side |
| AI assessment | Ollama Cloud — `gpt-oss:20b` |
| Hosting | Vercel |

## Deploy to Vercel

### 1. Clone / upload the project

```bash
git init
git add .
git commit -m "init"
```

Or just drag the folder into [vercel.com/new](https://vercel.com/new).

### 2. Set environment variable

In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `OLLAMA_API_KEY` | Your Ollama Cloud API key |

### 3. Deploy

```bash
npx vercel --prod
```

That's it. No database, no build step.

## Project structure

```
outdoor-safety-monitor/
├── index.html          # Frontend (single page)
├── api/
│   └── assess.js       # Serverless function — Ollama Cloud proxy
├── vercel.json         # Routing config
├── package.json        # Node deps (Anthropic SDK as Ollama client)
└── README.md
```

## Safety thresholds

| Metric | Caution | Warning | Danger |
|---|---|---|---|
| Temperature | ≥ 85°F | ≥ 95°F | ≥ 105°F |
| AQI | ≥ 101 | ≥ 151 | ≥ 201 |
| Wet Bulb Temp | ≥ 75°F | ≥ 82°F | ≥ 90°F |

The banner level is driven by whichever metric is most severe.

## Local development

```bash
npm install
npx vercel dev
```

Add `OLLAMA_API_KEY=your_key` to a `.env.local` file for local runs.
