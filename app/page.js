"use client";
import { useState, useEffect, useCallback } from "react";

const SPRINGS = [
  { id: 1, name: "Taste", emoji: "🍷", color: "#D4A574" },
  { id: 2, name: "Sex", emoji: "🔥", color: "#E85D75" },
  { id: 3, name: "The Senses", emoji: "✨", color: "#C4A1FF" },
  { id: 4, name: "Wealth", emoji: "💰", color: "#F0C755" },
  { id: 5, name: "Power", emoji: "👑", color: "#FF8C42" },
  { id: 6, name: "Curiosity", emoji: "🔍", color: "#6EC6CA" },
  { id: 7, name: "Belonging", emoji: "🤝", color: "#7DB46C" },
  { id: 8, name: "Reputation", emoji: "🪞", color: "#A8B4E0" },
  { id: 9, name: "Piety", emoji: "🕊️", color: "#E0D5C0" },
  { id: 10, name: "Sympathy", emoji: "💛", color: "#FFD700" },
  { id: 11, name: "Antipathy", emoji: "⚡", color: "#9B2335" },
  { id: 12, name: "Ease", emoji: "☁️", color: "#B0C4DE" },
  { id: 13, name: "Self-Preservation", emoji: "🛡️", color: "#708090" },
  { id: 14, name: "Self-Regard", emoji: "🌀", color: "#9370DB" },
];

const TABS = [
  { key: "original", accent: "#8899AA", icon: "📄", label: "Original" },
  { key: "neutral", accent: "#6EC6CA", icon: "⚖️", label: "Neutral" },
  { key: "eulogistic", accent: "#7DB46C", icon: "🌿", label: "Eulogistic" },
  { key: "dyslogistic", accent: "#E85D75", icon: "🗡️", label: "Dyslogistic" },
  { key: "inverted", accent: "#C4A1FF", icon: "🔄", label: "Inverted" },
];

const T = { bg: "#0B1215", headerBg: "#0F1A1E", cardBg: "#131F24", borderColor: "#1C3038", textColor: "#C8DDE0", accent: "#6EC6CA" };
const CC = { eulogistic: "#7DB46C", neutral: "#6EC6CA", dyslogistic: "#E85D75" };

const SAMPLES = [
  { label: "Political Speech", text: "Our courageous leaders have made the tough but necessary decision to right-size government spending, cutting wasteful programs that burden hardworking taxpayers. This bold fiscal responsibility will unleash the job creators and restore prosperity for all Americans." },
  { label: "Corporate Memo", text: "We're excited to announce a strategic restructuring to better serve our customers. By streamlining operations and empowering our high-performing teams, we'll unlock new efficiencies and accelerate our journey toward market leadership. Some roles will be impacted as we optimize for the future." },
  { label: "News Article", text: "The controversial billionaire's aggressive expansion into the struggling community has drawn fire from grassroots activists who accuse him of exploiting vulnerable residents. Supporters call him a visionary philanthropist bringing desperately needed investment to a neglected area." },
  { label: "Health Policy", text: "The compassionate new healthcare initiative will provide comprehensive coverage to underserved populations. Critics warn it's a reckless entitlement expansion that will bankrupt the system and create dependency among those who should be taking personal responsibility for their wellbeing." },
];

// ─── Tooltip ─────────────────────────────────────────
function Tooltip({ seg, pos }) {
  const rows = [
    { l: "Original", t: seg.text, c: seg.column },
    { l: "Neutral", t: seg.neutral_replacement, c: "neutral" },
    { l: "Eulogistic", t: seg.eulogistic_replacement, c: "eulogistic" },
    { l: "Dyslogistic", t: seg.dyslogistic_replacement, c: "dyslogistic" },
    { l: "Inverted", t: seg.inverted_replacement, c: seg.column === "eulogistic" ? "dyslogistic" : seg.column === "dyslogistic" ? "eulogistic" : "neutral" },
  ];
  return (
    <div style={{
      position: "fixed", left: Math.min(pos.x, (typeof window !== "undefined" ? window.innerWidth : 800) - 360), top: pos.y + 10,
      zIndex: 9999, width: 350, padding: 16, borderRadius: 10,
      background: "#0D181C", border: "1px solid #2A4A55",
      boxShadow: "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(106,198,202,0.15)",
      animation: "tooltipIn 0.15s ease-out", pointerEvents: "none",
    }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.4, marginBottom: 6 }}>
        Rhetorical Shift · <span style={{ color: CC[seg.column] }}>{seg.column}</span> original
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, width: 60, textAlign: "right", opacity: 0.4, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>{r.l}</span>
            <span style={{
              fontSize: 12, fontWeight: i === 0 ? 400 : 600, fontFamily: "'IBM Plex Mono', monospace",
              color: CC[r.c] || "#8899AA",
              textDecoration: i === 0 ? "line-through" : "none",
              textDecorationColor: i === 0 ? (CC[r.c] || "#888") + "66" : undefined,
              opacity: i === 0 ? 0.6 : 1,
            }}>{r.t || "—"}</span>
          </div>
        ))}
      </div>
      {(seg.springs || []).length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          {seg.springs.map(sid => {
            const s = SPRINGS.find(sp => sp.id === sid);
            return s ? <span key={sid} style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 600,
              background: s.color + "22", color: s.color, border: `1px solid ${s.color}44`,
            }}>{s.emoji} {s.name}</span> : null;
          })}
        </div>
      )}
      {seg.explanation && <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#C8DDE0BB" }}>{seg.explanation}</div>}
    </div>
  );
}

// ─── Annotated Text ──────────────────────────────────
function AnnotatedText({ segments, activeView, showAnnotations, springFilter }) {
  const [hovered, setHovered] = useState(null);
  const [tPos, setTPos] = useState({ x: 0, y: 0 });
  const onEnter = useCallback((e, i) => {
    const r = e.target.getBoundingClientRect();
    setTPos({ x: r.left, y: r.bottom });
    setHovered(i);
  }, []);

  const getText = (seg) => {
    if (seg.type === "text") return seg.text;
    if (activeView === "original") return seg.text;
    return seg[activeView + "_replacement"] || seg.text;
  };

  return (
    <div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, lineHeight: 2.1, color: T.textColor, whiteSpace: "pre-wrap" }}>
        {segments.map((seg, i) => {
          const dt = getText(seg);
          if (seg.type === "text" || !showAnnotations) return <span key={i}>{dt}</span>;
          const spr = seg.springs || [];
          const dim = springFilter !== null && !spr.includes(springFilter);
          const ps = spr.length > 0 ? SPRINGS.find(s => s.id === spr[0]) : null;
          const col = ps ? ps.color : (TABS.find(t => t.key === activeView)?.accent || T.accent);
          const isH = hovered === i;
          return (
            <span key={i} onMouseEnter={e => onEnter(e, i)} onMouseLeave={() => setHovered(null)}
              style={{
                position: "relative", cursor: "pointer",
                borderBottom: `2px solid ${dim ? T.borderColor : col + (isH ? "FF" : "66")}`,
                background: isH && !dim ? col + "15" : "transparent",
                borderRadius: isH ? 3 : 0, padding: isH ? "2px 3px" : "0 1px",
                transition: "all 0.12s ease", color: dim ? T.textColor + "30" : T.textColor,
              }}>
              {dt}
              {!dim && spr.length > 0 && (
                <span style={{ position: "relative", top: -9, marginLeft: 1, display: "inline-flex", gap: 1.5 }}>
                  {spr.slice(0, 3).map(sid => {
                    const s = SPRINGS.find(sp => sp.id === sid);
                    return s ? <span key={sid} style={{
                      display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                      background: s.color, boxShadow: isH ? `0 0 5px ${s.color}99` : "none",
                    }} /> : null;
                  })}
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showAnnotations && hovered !== null && segments[hovered]?.type === "annotated" && (
        <Tooltip seg={segments[hovered]} pos={tPos} />
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────
export default function Page() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState("original");
  const [annos, setAnnos] = useState(true);
  const [springsOpen, setSpringsOpen] = useState(false);
  const [springFilter, setSpringFilter] = useState(null);
  const [info, setInfo] = useState(false);

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || "Failed"); }
      const d = await r.json();
      setResult(d); setView("original"); setAnnos(true);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const [dots, setDots] = useState("");
  useEffect(() => {
    if (!loading) return;
    const i = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
    return () => clearInterval(i);
  }, [loading]);

  // Detected springs
  const dSprings = [];
  const seen = new Set();
  if (result?.original_segments) {
    result.original_segments.forEach(s => {
      if (s.type === "annotated" && s.springs) s.springs.forEach(id => {
        if (!seen.has(id)) { seen.add(id); const sp = SPRINGS.find(x => x.id === id); if (sp) dSprings.push(sp); }
      });
    });
  }
  dSprings.sort((a, b) => a.id - b.id);
  const curTab = TABS.find(t => t.key === view) || TABS[0];

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ background: T.headerBg, borderBottom: `1px solid ${T.borderColor}`, padding: "16px 24px", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(16px)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, fontWeight: 800, color: T.accent }}>⚙️ Springs of Action</h1>
            <span style={{ fontSize: 11, opacity: 0.4, fontStyle: "italic" }}>Bentham's Rhetorical X-Ray</span>
          </div>
          <button onClick={() => setInfo(!info)} style={{ background: "none", border: `1px solid ${T.borderColor}`, color: T.textColor, padding: "5px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", opacity: 0.6 }}>
            {info ? "Hide" : "How it works"}
          </button>
        </div>
        {info && (
          <div className="slide-up" style={{ maxWidth: 1000, margin: "14px auto 0", padding: 14, background: T.cardBg, borderRadius: 8, border: `1px solid ${T.borderColor}`, fontSize: 12.5, lineHeight: 1.6 }}>
            <p style={{ marginBottom: 6 }}>Paste any text. The analyzer produces <b>all four Benthamite readings</b> at once — switch via tabs. Toggle <b>annotations</b> to see underlines on loaded words. <b>Hover</b> any annotation to see all four versions plus springs. Use the <b>spring filter</b> to isolate phrases by motivation.</p>
          </div>
        )}
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px 80px" }}>
        {/* Input */}
        <textarea value={input} onChange={e => setInput(e.target.value)}
          placeholder="Paste any text — news, speeches, memos, transcripts, social media posts..."
          rows={6} style={{
            width: "100%", padding: 16, borderRadius: 8, border: `1px solid ${T.borderColor}`,
            background: T.cardBg, color: T.textColor, fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, lineHeight: 1.6, resize: "vertical", marginBottom: 16,
          }} />

        {/* Samples + Button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1 }}>
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.35, alignSelf: "center", marginRight: 2 }}>Samples:</span>
            {SAMPLES.map(s => (
              <button key={s.label} onClick={() => { setInput(s.text); setResult(null); }}
                style={{ padding: "4px 10px", borderRadius: 5, background: T.cardBg, border: `1px solid ${T.borderColor}`, color: T.textColor, fontSize: 11, opacity: 0.6, cursor: "pointer", transition: "all 0.12s ease" }}>
                {s.label}
              </button>
            ))}
          </div>
          <button onClick={analyze} disabled={loading || !input.trim()} style={{
            padding: "11px 28px", borderRadius: 8, border: "none",
            background: loading ? T.accent + "44" : T.accent, color: T.bg,
            fontSize: 14, fontWeight: 700, cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: !input.trim() ? 0.35 : 1, transition: "all 0.2s ease", whiteSpace: "nowrap",
          }}>
            {loading ? `Analyzing${dots}` : "⚙️ Analyze"}
          </button>
        </div>

        {error && <div style={{ padding: 14, borderRadius: 8, background: "#E85D7518", border: "1px solid #E85D7533", color: "#E85D75", fontSize: 13, marginBottom: 20 }}>{error}</div>}

        {/* Results */}
        {result && (
          <div className="slide-up">
            {/* Tab bar + controls */}
            <div style={{ display: "flex", alignItems: "stretch", borderBottom: `1px solid ${T.borderColor}`, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flex: 1, overflowX: "auto" }}>
                {TABS.map(tab => {
                  const a = view === tab.key;
                  return (
                    <button key={tab.key} onClick={() => setView(tab.key)} style={{
                      padding: "10px 14px", background: "none", border: "none",
                      borderBottom: a ? `2.5px solid ${tab.accent}` : "2.5px solid transparent",
                      color: a ? tab.accent : T.textColor + "55", fontSize: 12.5, fontWeight: a ? 600 : 400,
                      display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
                      transition: "all 0.15s ease", whiteSpace: "nowrap",
                    }}>
                      <span style={{ fontSize: 13 }}>{tab.icon}</span>{tab.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 12px" }}>
                {/* Annotations toggle */}
                <button onClick={() => setAnnos(!annos)} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", color: T.textColor, padding: "4px 0" }}>
                  <span style={{ fontSize: 10.5, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Annotations</span>
                  <div style={{
                    width: 34, height: 18, borderRadius: 9, position: "relative",
                    background: annos ? curTab.accent + "55" : T.borderColor, transition: "background 0.2s ease",
                  }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%", position: "absolute", top: 2,
                      background: annos ? curTab.accent : "#556",
                      transform: annos ? "translateX(18px)" : "translateX(2px)",
                      transition: "transform 0.2s ease, background 0.2s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }} />
                  </div>
                </button>
                {/* Springs toggle */}
                <button onClick={() => setSpringsOpen(!springsOpen)} style={{
                  padding: "5px 10px", borderRadius: 5, fontSize: 11, cursor: "pointer",
                  background: springsOpen ? curTab.accent + "22" : "transparent",
                  border: `1px solid ${springsOpen ? curTab.accent + "55" : T.borderColor}`,
                  color: springsOpen ? curTab.accent : T.textColor + "66", transition: "all 0.15s ease",
                }}>🌀 Springs</button>
              </div>
            </div>

            {/* Content area */}
            <div style={{ display: "flex", gap: 0 }}>
              {/* Main text */}
              <div style={{
                flex: 1, padding: 24, background: T.cardBg,
                borderRadius: springsOpen ? "0 0 0 8px" : "0 0 8px 8px",
                border: `1px solid ${T.borderColor}`, borderTop: "none", minHeight: 200,
              }}>
                {/* Spring filter chips */}
                {annos && dSprings.length > 0 && (
                  <div className="fade-in" style={{ marginBottom: 16, display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center", paddingBottom: 14, borderBottom: `1px solid ${T.borderColor}` }}>
                    <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.35, marginRight: 2 }}>Filter:</span>
                    <button onClick={() => setSpringFilter(null)} style={{
                      padding: "3px 9px", borderRadius: 10, fontSize: 10, fontWeight: 500, cursor: "pointer",
                      background: springFilter === null ? curTab.accent + "28" : "transparent",
                      color: springFilter === null ? curTab.accent : T.textColor + "44",
                      border: `1px solid ${springFilter === null ? curTab.accent + "55" : T.borderColor}`,
                    }}>All</button>
                    {dSprings.map(s => (
                      <button key={s.id} onClick={() => setSpringFilter(springFilter === s.id ? null : s.id)} style={{
                        padding: "3px 9px", borderRadius: 10, fontSize: 10, fontWeight: 500, cursor: "pointer",
                        display: "inline-flex", alignItems: "center", gap: 3,
                        background: springFilter === s.id ? s.color + "28" : "transparent",
                        color: springFilter === s.id ? s.color : T.textColor + "44",
                        border: `1px solid ${springFilter === s.id ? s.color + "55" : T.borderColor}`,
                        transition: "all 0.15s ease",
                      }}>{s.emoji} {s.name}</button>
                    ))}
                  </div>
                )}

                {/* Text */}
                <div key={view} className="fade-in">
                  {result.original_segments ? (
                    <AnnotatedText segments={result.original_segments} activeView={view} showAnnotations={annos} springFilter={springFilter} />
                  ) : (
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                      {view === "original" ? input : result[view + "_text"] || input}
                    </div>
                  )}
                </div>

                {/* Analysis */}
                {result.overall_analysis && (
                  <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${T.borderColor}`, fontSize: 13, fontStyle: "italic", color: curTab.accent, lineHeight: 1.6 }}>
                    <strong style={{ fontStyle: "normal", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.6 }}>Benthamite Analysis</strong><br />
                    {result.overall_analysis}
                  </div>
                )}

                {/* Legend */}
                {annos && (
                  <div className="fade-in" style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.borderColor}`, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 10, opacity: 0.4 }}>
                    {[["#7DB46C","Eulogistic"],["#6EC6CA","Neutral"],["#E85D75","Dyslogistic"]].map(([c,l]) => (
                      <span key={l}><span style={{ display:"inline-block",width:6,height:6,borderRadius:"50%",background:c,marginRight:4,verticalAlign:"middle" }}/>{l}</span>
                    ))}
                    <span>● dots = springs · hover for all four versions</span>
                  </div>
                )}
              </div>

              {/* Springs side panel */}
              {springsOpen && (
                <div className="fade-in" style={{
                  width: 270, flexShrink: 0, padding: 16, background: "#0E1A1F",
                  borderRadius: "0 0 8px 0", border: `1px solid ${T.borderColor}`, borderTop: "none", borderLeft: "none",
                  overflowY: "auto", maxHeight: 600,
                }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.4, marginBottom: 12 }}>Springs Detected</div>
                  {(result.springs_detected || []).length === 0 ? (
                    <p style={{ fontSize: 12, opacity: 0.4 }}>None identified.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {result.springs_detected.map((s, i) => {
                        const sp = SPRINGS.find(x => x.id === s.spring_id);
                        if (!sp) return null;
                        return (
                          <div key={i} style={{ padding: 10, borderRadius: 7, background: sp.color + "0D", border: `1px solid ${sp.color}22` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 16 }}>{sp.emoji}</span>
                              <span style={{ fontWeight: 600, color: sp.color, fontSize: 12 }}>{sp.name}</span>
                              <span style={{ fontSize: 9, opacity: 0.3, marginLeft: "auto" }}>#{sp.id}</span>
                            </div>
                            <div style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.7 }}>{s.relevance}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${T.borderColor}` }}>
                    <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.3, marginBottom: 8 }}>All 14 Springs</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {SPRINGS.map(s => {
                        const det = (result.springs_detected || []).some(d => d.spring_id === s.id);
                        return <span key={s.id} style={{
                          fontSize: 9, padding: "2px 6px", borderRadius: 8,
                          background: det ? s.color + "1A" : "transparent",
                          color: det ? s.color : T.textColor + "28",
                          border: `1px solid ${det ? s.color + "33" : T.borderColor + "55"}`,
                        }}>{s.emoji} {s.name}</span>;
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
