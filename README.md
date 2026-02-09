# ⚙️ Springs of Action — Bentham's Rhetorical X-Ray

A web tool that analyzes any text through Jeremy Bentham's rhetorical framework from *A Table of the Springs of Action* (1817). It identifies loaded language, reveals the underlying human motivations ("springs"), and lets you see the same text recast through four different rhetorical lenses.

## What It Does

- **Paste any text** — news articles, political speeches, corporate memos, social media posts, transcripts
- **See all four Benthamite readings** via tabs:
  - 📄 **Original** — your source text
  - ⚖️ **Neutral** — all spin stripped
  - 🌿 **Eulogistic** — maximum praise
  - 🗡️ **Dyslogistic** — maximum blame
  - 🔄 **Inverted** — praise↔blame flipped
- **Toggle annotations** on/off to see underlined loaded words with hover tooltips
- **Filter by Spring** to isolate rhetoric driven by specific motivations (Wealth, Power, Reputation, etc.)
- **Springs panel** showing which of Bentham's 14 fundamental human motivations are at play

---

## Deploy to Vercel (5 minutes)

### Prerequisites
- A [GitHub](https://github.com) account
- An [Anthropic API key](https://console.anthropic.com/) (even a few dollars of credit goes a long way)

### Steps

1. **Push this project to GitHub**

   Create a new repo on GitHub, then:
   ```bash
   cd springs-of-action
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/springs-of-action.git
   git push -u origin main
   ```

2. **Deploy on Vercel**

   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click **"Add New Project"**
   - Import your `springs-of-action` repo
   - Under **Environment Variables**, add:
     - Key: `ANTHROPIC_API_KEY`
     - Value: your `sk-ant-...` key
   - Click **Deploy**

3. **You're live.** Vercel gives you a URL like `springs-of-action.vercel.app`. Share it with anyone.

### Custom Domain (Optional)

In Vercel dashboard → Settings → Domains → add your custom domain (e.g., `springs.yourdomain.com`).

---

## Run Locally

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/springs-of-action.git
cd springs-of-action

# Install dependencies
npm install

# Create .env.local with your API key
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
springs-of-action/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.js      ← API proxy (holds your key securely)
│   ├── globals.css
│   ├── layout.js
│   └── page.js               ← The full UI
├── public/
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```

## How the API Proxy Works

Your Anthropic API key **never** reaches the browser. The flow is:

```
Browser → /api/analyze (your Vercel server) → Anthropic API
```

The server-side route in `app/api/analyze/route.js`:
- Validates input (max 10,000 chars)
- Rate limits by IP (10 requests/minute)
- Calls Anthropic with your key
- Returns the analysis to the browser

## Cost Estimate

Each analysis uses ~2,000-4,000 tokens of output from Claude Sonnet. At current pricing, that's roughly **$0.01-0.03 per analysis**. Even heavy usage (100 analyses/day) would cost around $1-3/day.

---

## Adding a Chrome Extension Later

Once deployed, you have a public API endpoint at `https://your-app.vercel.app/api/analyze`. A Chrome extension can call this same endpoint — highlight text on any page, right-click, and analyze in a side panel. The CORS headers are already configured to allow this.

---

Based on *A Table of the Springs of Action* by Jeremy Bentham (1817).
