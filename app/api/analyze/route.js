const SYSTEM_PROMPT = `You are a rhetorical analyst based on Jeremy Bentham's "A Table of the Springs of Action" (1817).

Bentham identified that nearly every human motive has three names:
- EULOGISTIC (praise word): casts the motive favorably
- NEUTRAL (plain word): describes without judgment
- DYSLOGISTIC (blame word): casts the motive negatively

He also identified 14 "Springs of Action":
1. Taste 2. Sex 3. The Senses 4. Wealth 5. Power 6. Curiosity 7. Belonging
8. Reputation 9. Piety 10. Sympathy 11. Antipathy 12. Ease 13. Self-Preservation 14. Self-Regard

YOUR TASK: Given a piece of text, produce ALL FOUR transformations at once (neutral, eulogistic, dyslogistic, inverted) and a segment-based annotation of the original text.

CRITICAL: Respond ONLY with valid JSON. No markdown, no backticks, no explanation outside the JSON.

{
  "original_segments": [
    { "type": "text", "text": "plain unannotated text" },
    {
      "type": "annotated",
      "text": "the original word/phrase exactly as in input",
      "column": "eulogistic|neutral|dyslogistic",
      "neutral_replacement": "plain version",
      "eulogistic_replacement": "praise version",
      "dyslogistic_replacement": "blame version",
      "inverted_replacement": "flipped version (eul->dys, dys->eul, neutral stays)",
      "springs": [4, 8],
      "explanation": "Brief explanation of the rhetorical move and which springs"
    }
  ],
  "neutral_text": "Full text rewritten neutrally",
  "eulogistic_text": "Full text rewritten with maximum praise",
  "dyslogistic_text": "Full text rewritten with maximum blame",
  "inverted_text": "Full text with eulogistic<->dyslogistic flipped",
  "springs_detected": [
    { "spring_id": 4, "spring_name": "Wealth", "relevance": "How this spring operates" }
  ],
  "overall_analysis": "2-3 sentence Benthamite analysis"
}

CRITICAL RULES:
- The segments break the ORIGINAL INPUT TEXT into pieces. Concatenating all segment "text" fields MUST reproduce the exact original input.
- Mark every rhetorically loaded word or phrase as "annotated" with all four replacement versions.
- Be thorough: catch "job creators" (eulogistic), "bureaucrats" (dyslogistic), "streamlining" (eulogistic for cutting), etc.
- For INVERTED: eulogistic terms become dyslogistic, dyslogistic become eulogistic, neutral stays neutral.`;

// Simple rate limiter
const rateLimit = new Map();
function checkRate(ip) {
  const now = Date.now();
  const e = rateLimit.get(ip);
  if (!e || now - e.t > 60000) { rateLimit.set(ip, { t: now, c: 1 }); return true; }
  if (e.c >= 10) return false;
  e.c++;
  return true;
}

export async function POST(request) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRate(ip)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), { status: 429, headers });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server not configured. Missing API key." }), { status: 500, headers });
  }

  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "No text provided." }), { status: 400, headers });
    }
    if (text.length > 50000) {
      return new Response(JSON.stringify({ error: "Text too long. Max 10,000 characters." }), { status: 400, headers });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: 'Analyze this text:\n\n"""\n' + text + '\n"""' }],
      }),
    });

    if (!res.ok) {
      console.error("Anthropic error:", await res.text());
      return new Response(JSON.stringify({ error: "Analysis service error." }), { status: 502, headers });
    }

    const data = await res.json();
    const raw = data.content?.map(b => b.text || "").join("") || "";
    const parsed = JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g, "").trim());

    return new Response(JSON.stringify(parsed), { status: 200, headers });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Analysis failed. Please try again." }), { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
