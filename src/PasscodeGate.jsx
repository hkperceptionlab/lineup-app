import React, { useState } from "react";

/*
 * A doorbell, not a lock.
 *
 * This is a static site, so the expected word ends up in the JS bundle no
 * matter where it is stored, and the Supabase key sits next to it — anyone
 * determined can skip this screen entirely and talk to the database directly.
 * What it does stop is the accidental visitor: someone who is handed the URL,
 * or finds it in a browser history, and would otherwise be able to claim a
 * jersey number and post to the team wall.
 *
 * If this ever needs to be a real lock, the answer is Supabase Auth with RLS,
 * because that check runs on Supabase's server rather than in the browser.
 */

const EXPECTED = import.meta.env.VITE_TEAM_PASSCODE || "goknights";
const STORAGE_KEY = "lineup:gate";

// Phone keyboards capitalize the first letter and teenagers add spaces, so
// "Go Knights", "goknights" and "GO KNIGHTS" all have to work.
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function alreadyIn() {
  try {
    return localStorage.getItem(STORAGE_KEY) === normalize(EXPECTED);
  } catch {
    return false;
  }
}

export default function PasscodeGate({ children }) {
  const [open, setOpen] = useState(alreadyIn);
  const [entry, setEntry] = useState("");
  const [wrong, setWrong] = useState(false);

  if (open) return children;

  const submit = (e) => {
    e.preventDefault();
    if (normalize(entry) !== normalize(EXPECTED)) {
      setWrong(true);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, normalize(EXPECTED));
    } catch {
      /* private mode: they'll just enter it again next time */
    }
    setOpen(true);
  };

  return (
    <div style={S.wrap}>
      <form style={S.card} onSubmit={submit}>
        <div style={S.crest}>
          <svg width="76" height="76" viewBox="0 0 512 512" aria-hidden="true">
            <rect width="512" height="512" rx="96" fill="#8E2740" />
            <text
              x="256"
              y="356"
              fontFamily="Georgia, serif"
              fontSize="340"
              fontWeight="700"
              fill="#F0A81C"
              textAnchor="middle"
            >
              M
            </text>
          </svg>
        </div>

        <h1 style={S.title}>LINE UP</h1>
        <p style={S.sub}>MPrep Girls&apos; Soccer JV</p>

        <label htmlFor="passcode" style={S.label}>
          Enter the team word your coach gave you.
        </label>
        <input
          id="passcode"
          value={entry}
          onChange={(e) => {
            // Lowercase as they type, so the field always shows what it is
            // rather than the capital the phone keyboard insists on.
            setEntry(e.target.value.toLowerCase());
            setWrong(false);
          }}
          placeholder="Team word"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          style={{ ...S.input, borderColor: wrong ? "#D9705C" : "#26303A" }}
        />
        {wrong && <div style={S.error}>That&apos;s not it — check with your coach.</div>}

        <button type="submit" style={S.btn} disabled={!entry.trim()}>
          Enter
        </button>
      </form>
    </div>
  );
}

const S = {
  wrap: {
    minHeight: "100dvh",
    background: "#10151A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  card: { width: "100%", maxWidth: 380, textAlign: "center" },
  crest: { marginBottom: 18 },
  title: { color: "#F1EFE7", fontSize: 34, letterSpacing: 2, margin: "0 0 4px", fontWeight: 800 },
  sub: { color: "#8B97A3", fontSize: 15, margin: "0 0 32px" },
  label: { display: "block", color: "#B8C2CC", fontSize: 15, marginBottom: 12, lineHeight: 1.5 },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#171F26",
    border: "1px solid #26303A",
    borderRadius: 12,
    padding: "16px 16px",
    color: "#F1EFE7",
    fontSize: 16, // keeps iOS Safari from zooming the page on focus
    outline: "none",
    textAlign: "center",
    textTransform: "lowercase",
  },
  error: { color: "#D9705C", fontSize: 14, marginTop: 10 },
  btn: {
    width: "100%",
    marginTop: 16,
    background: "#F0A81C",
    color: "#10151A",
    border: "none",
    borderRadius: 12,
    padding: "16px 20px",
    fontSize: 17,
    fontWeight: 700,
    minHeight: 52,
    cursor: "pointer",
  },
};
