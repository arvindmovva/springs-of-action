const SYSTEM_PROMPT = `You are a rhetorical analyst based on Jeremy Bentham's "A Table of the Springs of Action" (1817).

Bentham identified that nearly every human motive has three names:
- EULOGISTIC (praise word): casts the motive favorably
- NEUTRAL (plain word): describes without judgment
- DYSLOGISTIC (blame word): casts the motive negatively

He also identified 14 "Springs of Action":
1. Taste 2. Sex 3. The Senses 4. Wealth 5. Power 6. Curiosity 7. Belonging
8. Reputation 9. Piety 10. Sympathy 11. Antipathy 12. Ease 13. Self-Preservation 14. Self-Regard

YOUR TASK: Given text, produce ALL FOUR transformations and segment-based annotations.

CRITICAL: Respond ONLY with valid JSON. No markdown, no backticks.

IMPORTANT FOR LONG TEXTS: Be efficient. Only annotate the MOST rhetorically significant words and phrases (aim for 10-20 annotations max, even for long texts). Leave mundane connecting text as plain "text" segments. Keep explanations to one sentence. This ensures your response fits within limits.

{
  "original_segments": [
    { "type": "text", "text": "plain unannotated text" },
    {
      "type": "annotated",
      "text": "original word/phrase exactly as in input",
      "column": "eulogistic|neutral|dyslogistic",
      "neutral_replacement": "plain version",
      "eulogistic_replacement": "praise version",
      "dyslogistic_replacement": "blame version",
      "inverted_replacement": "flipped version",
      "springs": [4, 8],
      "explanation": "One sentence explanation"
    }
  ],
  "neutral_text": "Full text rewritten neutrally",
  "eulogistic_text": "Full text rewritten with maximum praise",
  "dyslogistic_text": "Full text rewritten with maximum blame",
  "inverted_text": "Full text with eulogistic<->dyslogistic flipped",
  "springs_detected": [
    { "spring_id": 4, "spring_name": "Wealth", "relevance": "Brief explanation" }
  ],
  "overall_analysis": "2-3 sentence analysis"
}

RULES:
- Segments must concatenate to reproduce the exact original input.
- For INVERTED: eulogistic becomes dyslogistic and vice versa.
- Keep total response compact. Prioritize the most loaded terms.`;

const rateLimit = new Map();
function checkRate(ip) {
  const now = Date.now();
  const e = rateLimit.get(ip);
  if (!e || now - e.t > 60000) { rateLimit.set(ip, { t: now, c: 1 }); return true; }
  if (e.c >= 20) return false;
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
    return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server not configured." }), { status: 500, headers });
  }

  try {
    const body = await request.json();
    const text = body.text;
    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "No text provided." }), { status: 400, headers });
    }
    if (text.length > 50000) {
      return new Response(JSON.stringify({ error: "Text too long. Max 50,000 chars." }), { status: 400, headers });
    }

    var prompt = "Analyze this text. Remember to keep annotations to the 10-20 MOST rhetorically loaded terms only:\n\n" + '"""' + "\n" + text + "\n" + '"""';

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
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      var errText = await res.text();
      console.error("Anthropic error:", errText);
      return new Response(JSON.stringify({ error: "Analysis service error." }), { status: 502, headers });
    }

    const data = await res.json();
    var raw = "";
    for (var i = 0; i < (data.content || []).length; i++) {
      raw += data.content[i].text || "";
    }
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    // Check if response was truncated (stop_reason !== "end_of_turn")
    var stopReason = data.stop_reason || "unknown";
    console.log("Stop reason:", stopReason, "Response length:", raw.length);

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.error("JSON parse failed. Stop reason:", stopReason, "Length:", raw.length);
      console.error("Last 200 chars:", raw.substring(raw.length - 200));

      // If truncated, try to salvage by finding the last complete segment
      if (stopReason === "max_tokens") {
        // Return a simplified response with just the raw text transformations
        return new Response(JSON.stringify({
          error: null,
          original_segments: [{ type: "text", text: text }],
          neutral_text: "Text was too long for full annotation. Try a shorter passage.",
          eulogistic_text: "Text was too long for full annotation. Try a shorter passage.",
          dyslogistic_text: "Text was too long for full annotation. Try a shorter passage.",
          inverted_text: "Text was too long for full annotation. Try a shorter passage.",
          springs_detected: [],
          overall_analysis: "The text was too long to fully analyze. Try pasting a shorter excerpt (a few paragraphs) for detailed annotation."
        }), { status: 200, headers });
      }

      return new Response(JSON.stringify({ error: "Failed to parse analysis. Try a shorter text." }), { status: 500, headers });
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Analysis failed: " + err.message }), { status: 500, headers });
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
