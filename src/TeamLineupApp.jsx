import React, { useState, useEffect, useCallback, useRef } from "react";

/* ─────────────────────────────────────────────
   LINE UP — Marianapolis Prep · Girls’ Soccer JV (Golden Knights)
   Teamwork & mental check-in app
   Privacy principles:
   - Mood is visible to the player only (stored locally, never shared)
   - The team only sees an anonymous count of who checked in / stretched today
   - Points/crowns come only from cheering, never from check-in status
   - A made-up player number instead of a name (not the real jersey number)
───────────────────────────────────────────── */

const TEAM_NAME = "MPrep Girls’ Soccer JV";
const COACH_NAME = "Mr. Brooks";

const SEASON_ID = "2026-fall";

const OPPONENTS = [
  "Pomfret School",
  "Worcester Academy",
  "Rectory School",
  "Mt. St. Charles Academy",
  "Portsmouth Abbey School",
];

// 2026 fall season, from the school athletics page. After editing this list,
// bump SEASON_ID so new games merge in without wiping results already entered.
const SEASON_SCHEDULE = [
  { id: "s26-0919-pomfret", opponent: "Pomfret School", date: "2026-09-19", time: "14:00", location: "Playing Fields - Field 1", homeAway: "home", result: { outcome: "L", score: "2-3" } },
  { id: "s26-0926-worcester", opponent: "Worcester Academy", date: "2026-09-26", time: "13:00", location: "Playing Fields - Field 1", homeAway: "home", result: null },
  { id: "s26-1003-rectory", opponent: "Rectory School", date: "2026-10-03", time: "12:00", location: "Playing Fields - Field 3", homeAway: "home", result: null },
  { id: "s26-1007-pomfret", opponent: "Pomfret School", date: "2026-10-07", time: "14:30", location: "Pomfret School", homeAway: "away", result: null },
  { id: "s26-1017-rectory", opponent: "Rectory School", date: "2026-10-17", time: "13:00", location: "Rectory School", homeAway: "away", result: null },
  { id: "s26-1024-mtstcharles", opponent: "Mt. St. Charles Academy", date: "2026-10-24", time: "13:00", location: "Mt. St. Charles Academy", homeAway: "home", result: null },
  { id: "s26-1107-portsmouth", opponent: "Portsmouth Abbey School", date: "2026-11-07", time: "14:30", location: "Portsmouth Abbey School", homeAway: "away", result: null },
];

// Cheers go to the whole team, so the cap is per sender: a few a day, or the
// crowns would belong to whoever typed "ok" thirty times.
const CHEER_DAILY_LIMIT = 3;

const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap";

const MOODS = [
  { key: "great", label: "Great", color: "#7FCB6E" },
  { key: "good", label: "Good", color: "#9AD1C9" },
  { key: "okay", label: "Okay", color: "#7FA8C9" },
  { key: "tough", label: "Tough", color: "#E0A15B" },
  { key: "bad", label: "Rough", color: "#D9705C" },
];

// A closed set, on purpose. Nothing here can carry an insult, a name, or
// something a 14-year-old would regret, so there is nothing to moderate.
// Optional icon on a cheer. These used to be a separate anonymous button row
// that sent on tap, which read as "select" with no way to unselect; now you
// pick one (or none) and it goes out with the cheer.
const KUDOS = [
  { key: "keepgoing", icon: "💪", label: "Keep going" },
  { key: "proud", icon: "❤️", label: "Proud of you" },
  { key: "greatjob", icon: "👏", label: "Great job" },
  { key: "withyou", icon: "🤝", label: "With you" },
  { key: "allgood", icon: "🙂", label: "It's all good" },
];

// Taps instead of typing, for the things that are hard to start writing.
// Nothing about injuries here: the whole team can read this inbox, and who is
// hurt is between a player and the coach.
const COACH_PRESETS = [
  "Training's been heavy lately",
  "Could we do a lighter day?",
  "I'm not sure about my position",
  "Something about the team feels off",
];

const QUICK_CHEERS = ["Let's go, Knights!", "Great job today, team", "We got this tomorrow", "Proud of this team"];

// Marianapolis colors first. The maroon is lifted a little off the true
// crest maroon so the kit still reads against the dark background.
const SCHOOL_MAROON = "#8E2740";
const SCHOOL_GOLD = "#F0A81C";
const SOCK_COLORS = [SCHOOL_MAROON, SCHOOL_GOLD, "#F1EFE7", "#2F2A2E", "#F2A93B", "#7FCB6E", "#7FA8C9", "#D9705C", "#B98AE0", "#F5A9C8"];
const SKIN_TONES = ["#FFE0BD", "#F0C29B", "#E0A978", "#C68B59", "#8D5524", "#5C3A21"];
const HAIR_COLORS = ["#2B2320", "#5C3A21", "#8B5E34", "#D9A441", "#B0433E", "#B0B0B0", "#E8B4D8"];

// Each move carries `say` as well as `cue`: the figure is front-facing and
// small, so several of these read as "an arm moved a bit" no matter how they
// are drawn. The voice is what actually teaches the move; the drawing marks
// which one you're on. `hold` is the minimum time on screen — a move never
// advances before the voice has finished its sentence either.
// `switchSides` moves get a chime and a spoken "Switch sides" at the midpoint.
const STRETCH_MOVES = [
  { key: "reach", label: "Reach Up", hold: 20, benefit: "Good for: shoulders & spine",
    cue: "Reach both arms overhead and hold.",
    say: "Reach Up. Stand tall, feet hip-width apart. Reach both arms straight overhead and stretch as high as you can. Keep breathing.",
    pose: { torso: 0, armR: -150, armL: 150 } },

  { key: "side", label: "Side Stretch", hold: 24, switchSides: true, benefit: "Good for: obliques & lower back",
    cue: "Lean gently to one side, then the other.",
    say: "Side Stretch. Keep one arm overhead and lean slowly to the opposite side. You should feel it along your ribs.",
    pose: { torso: -8, armR: -150, armL: 20 } },

  { key: "twist", label: "Twist", hold: 20, benefit: "Good for: core & spine mobility",
    cue: "Rotate your upper body side to side.",
    say: "Twist. Plant your feet and rotate your upper body slowly to one side, then the other. Let your arms swing loose, and keep your hips facing forward.",
    pose: { torso: 6, armR: -20, armL: 95 } },

  { key: "toe", label: "Toe Touch", hold: 20, benefit: "Good for: hamstrings & lower back",
    cue: "Reach toward your toes, knees soft.",
    say: "Toe Touch. Feet apart, knees soft — not locked. Fold forward from your hips and reach down toward your toes. Only go as far as feels easy, and let your head hang.",
    pose: { torso: 0, armR: 55, armL: -55 } },

  { key: "circles", label: "Arm Circles", hold: 18, benefit: "Good for: shoulders & warm-up",
    cue: "Big slow circles with both arms.",
    say: "Arm Circles. Hold both arms straight out to your sides. Make big, slow circles forward. After a few, reverse and circle backward.",
    pose: { torso: 0, armR: -90, armL: 90 } },

  { key: "shoulders", label: "Shoulder Roll", hold: 15, benefit: "Good for: neck & upper back",
    cue: "Roll your shoulders up, back, and down.",
    say: "Shoulder Roll. Let your arms hang. Roll your shoulders up toward your ears, then back, then down. Slow and steady, and breathe out as they drop.",
    pose: { torso: 0, armR: -40, armL: 40 } },

  { key: "crossbody", label: "Cross-Body Reach", hold: 20, switchSides: true, benefit: "Good for: shoulders & upper back",
    cue: "Reach one arm across your chest.",
    say: "Cross-Body Reach. Bring one arm straight across your chest. Use your other hand to hold it close, and keep that shoulder down.",
    pose: { torso: -4, armR: -60, armL: -40 } },

  { key: "quad", label: "Quad Stretch", hold: 24, switchSides: true, benefit: "Good for: quads & hip flexors",
    cue: "Heel up behind you, knee pointing down.",
    say: "Quad Stretch. Hold a wall or a teammate for balance. Bend one knee and bring that heel up behind you toward your glute. Keep your knees together and stand tall.",
    pose: { torso: 0, armR: -70, armL: 30, legR: 24 } },

  { key: "lunge", label: "Forward Lunge", hold: 24, switchSides: true, benefit: "Good for: hip flexors & glutes",
    cue: "Step forward, bend the front knee.",
    say: "Forward Lunge. Step one foot well forward and bend that knee over your ankle. Keep your back leg straight and your chest up, and sink down slowly.",
    pose: { torso: 4, armR: -30, armL: 30, legL: -30, legR: 22 } },

  { key: "calf", label: "Calf Stretch", hold: 20, switchSides: true, benefit: "Good for: calves & ankles",
    cue: "Back heel down, lean into the front knee.",
    say: "Calf Stretch. Step one foot back and press that heel flat into the ground, back leg straight. Lean forward into your front knee until you feel it in your calf.",
    pose: { torso: 6, armR: -35, armL: 35, legL: -20, legR: 14 } },
];

const RULES_QA = [
  { q: "What is offside?", a: "An attacker is offside if they're ahead of the last defender (closer to the goal) when the ball is played to them — with no defender, including the keeper, between them and the goal." },
  { q: "What's a clean sheet?", a: "When a team doesn't concede any goals in a match — the goalkeeper and defense kept the sheet \"clean.\"" },
  { q: "What happens on a yellow card?", a: "It's an official warning. Two yellow cards in one match equal a red card and the player is sent off." },
  { q: "What happens on a red card?", a: "The player is sent off immediately and the team plays the rest of the match down a player — no substitute allowed for that spot." },
  { q: "What's a free kick vs. a penalty kick?", a: "A free kick restarts play after most fouls, taken from where the foul happened. A penalty kick is awarded for a foul inside the penalty box, taken from the penalty spot with only the keeper defending." },
  { q: "What's a corner kick?", a: "Awarded to the attacking team when the ball crosses the goal line after last touching a defender. Taken from the corner arc nearest to where it went out." },
  { q: "What's a throw-in?", a: "Used to restart play when the ball fully crosses the touchline (sideline). Thrown in with both hands, from behind and over the head." },
  { q: "How long is a game?", a: "Two 45-minute halves at most competitive levels, plus stoppage time added by the referee for delays. JV games may run shorter halves — check with your coach." },
  { q: "What's stoppage time?", a: "Extra minutes added at the end of each half to make up for time lost to injuries, substitutions, or other delays." },
  { q: "What's a handball?", a: "When a player other than the goalkeeper (inside their own box) deliberately touches the ball with their hand or arm. Results in a free kick or penalty." },
];

const WARMUP_TIPS = [
  { q: "Dynamic vs. static stretching — what's the difference?", a: "Before a game, do dynamic (moving) stretches like leg swings and lunges — they warm up the muscles you're about to use. Save static (held) stretches for after, when your muscles are already warm." },
  { q: "How long should a warm-up be?", a: "Aim for 10–15 minutes: light jogging first to raise your heart rate, then dynamic stretches, then some light ball touches or sprints to get game-ready." },
  { q: "Why does warming up matter?", a: "Cold muscles are more likely to strain or tear. A proper warm-up increases blood flow and flexibility, which lowers injury risk and helps you move faster from the first whistle." },
  { q: "What's good form for a lunge?", a: "Keep your front knee over your ankle (not past your toes), back straight, and lower under control rather than dropping fast." },
  { q: "Should I stretch more in cold weather?", a: "Yes — cold muscles take longer to loosen up, so extend your warm-up a bit and keep moving between drills instead of standing still." },
  { q: "What if something actually hurts (not just tired)?", a: "Sharp or sudden pain is different from normal muscle fatigue. Stop, tell your coach, and don't push through it — playing through real pain usually turns a small issue into a bigger one." },
  { q: "Does a cool-down matter?", a: "Yes — a few minutes of light jogging or walking plus static stretching after a game helps your body recover and can reduce next-day soreness." },
  { q: "How much water should I drink before a game?", a: "Hydrate throughout the day, not just right before kickoff — a good habit is water with meals and a bottle with you at practice, not chugging it all 5 minutes before you play." },
];

const MENTAL_TIPS = [
  { q: "Nervous before a game — what can I do?", a: "Try slow \"box breathing\": inhale for 4 counts, hold for 4, exhale for 4, hold for 4. A few rounds can calm your nervous system before kickoff." },
  { q: "How do I stop dwelling on a mistake mid-game?", a: "Give yourself a quick physical cue — clap once, reset your stance — then deliberately shift focus to the very next play. The last mistake is already over; the next touch is what matters." },
  { q: "What's a simple pre-game mental routine?", a: "Consistency helps more than any specific ritual: the same warm-up order, a few deep breaths, maybe a short visualization of yourself making a good play. Doing it the same way each time signals to your brain \"it's game time.\"" },
  { q: "How do I turn nerves into something useful?", a: "Nerves and excitement feel almost the same physically (racing heart, energy). Instead of labeling it \"I'm nervous,\" try telling yourself \"I'm ready\" — it reframes the same feeling into something useful." },
  { q: "What should I actually focus on during a game?", a: "Focus on what you can control — your effort, your positioning, your next decision — instead of things you can't, like the score, the ref's calls, or what a teammate did." },
  { q: "How can visualization help?", a: "Spend a minute before a game picturing yourself making a clean pass, a good tackle, or a confident touch. Mentally rehearsing success can make it easier to execute under pressure." },
  { q: "What if I'm in a slump?", a: "Zoom out to a shorter timeframe — instead of judging the whole season, set one small, achievable goal for just the next training session or game." },
  { q: "Does talking to teammates actually help nerves?", a: "Yes — voicing what you're feeling to a teammate or coach (or anonymously through the coach inbox) tends to lower anxiety more than holding it in." },
];

// The team's day runs on Thompson, CT time rather than whatever timezone the
// phone happens to be in, so a late check-in lands on the right day and the
// app behaves the same when it's opened from anywhere else.
const TEAM_TZ = "America/New_York";
const _dayParts = new Intl.DateTimeFormat("en-US", {
  timeZone: TEAM_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dateKey = (d) => {
  const p = {};
  for (const part of _dayParts.formatToParts(d)) p[part.type] = part.value;
  return `${p.year}-${p.month}-${p.day}`;
};
const todayKey = () => dateKey(new Date());
// Step whole days on the team's calendar. Anchoring at noon UTC (mid-morning
// in CT) keeps this correct across daylight-saving changes.
const shiftKey = (key, daysBack) => {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - daysBack);
  return dateKey(d);
};

// ── Sound effects (synthesized, no audio files — no copyright issues) ──
let _audioCtx = null;
function getAudioCtx() {
  if (_audioCtx) return _audioCtx;
  try {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    return null;
  }
  return _audioCtx;
}
function playTone(freq, startTime, duration, waveType = "sine", peak = 0.15) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveType;
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + startTime;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  } catch (e) {
    /* audio not available, fail silently */
  }
}
const playGoalSound = () => {
  playTone(523.25, 0, 0.12, "triangle");
  playTone(659.25, 0.1, 0.12, "triangle");
  playTone(783.99, 0.2, 0.25, "triangle");
};
const playSavedSound = () => {
  playTone(220, 0, 0.2, "sawtooth", 0.1);
  playTone(160, 0.12, 0.25, "sawtooth", 0.1);
};
const playCorrectSound = () => {
  playTone(880, 0, 0.1, "sine");
  playTone(1108.73, 0.08, 0.15, "sine");
};
const playWrongSound = () => {
  playTone(200, 0, 0.2, "square", 0.08);
};
const playCrownSound = () => {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(f, i * 0.08, 0.15, "triangle", 0.12));
};
const playLevelClearSound = () => {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => playTone(f, i * 0.07, 0.2, "triangle", 0.12));
};

/* ── Warm-up voice ─────────────────────────────
   Every line is a pre-rendered clip in public/voice/<move key>.mp3, made by
   scripts/make_voice.py with Kokoro (Apache-2.0, voice af_heart) — far more
   human than any phone's built-in voice, and the same on every phone. The
   device voice is only the fallback if a clip fails to load. If you change a
   move's `say` text, re-run the script; a clip not listed here is never
   fetched. */
const RECORDED_CLIPS = new Set(["reach", "side", "twist", "toe", "circles", "shoulders", "crossbody", "quad", "lunge", "calf", "switch"]);

// Without a chosen voice the browser uses its default, which on Windows and
// on many phones is the oldest, most robotic one. Rank what the device has.
const GOOD_VOICE = /natural|neural|premium|enhanced|siri|google/i;
const NICE_NAMES = /samantha|ava|aria|jenny|allison|susan|karen|serena|moira|tessa|daniel|libby|sonia|emma|michelle/i;
const BAD_VOICE = /zira|david|mark|fred|albert|compact|espeak|bahh|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|kathy|bad news|good news/i;
let cachedVoice;
function pickVoice() {
  if (cachedVoice !== undefined) return cachedVoice;
  if (!("speechSynthesis" in window)) return (cachedVoice = null);
  const voices = window.speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  if (!voices.length) return null; // not loaded yet — don't cache, ask again next line
  const score = (v) =>
    (GOOD_VOICE.test(v.name) ? 6 : 0) + (NICE_NAMES.test(v.name) ? 3 : 0) + (/en[-_]US/i.test(v.lang) ? 1 : 0) - (BAD_VOICE.test(v.name) ? 10 : 0);
  cachedVoice = [...voices].sort((a, b) => score(b) - score(a))[0];
  return cachedVoice;
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    cachedVoice = undefined;
  });
}

// One shared element: iOS only lets an <audio> play from a timer if that same
// element was first played inside a tap (see unlockVoice).
let clipPlayer = null;
// 0.1s of real silence — an empty file may not count as "played" on iOS.
const SILENT_WAV = "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";

function unlockVoice() {
  if ("speechSynthesis" in window) {
    try {
      const warm = new SpeechSynthesisUtterance(" ");
      warm.volume = 0;
      window.speechSynthesis.speak(warm);
    } catch (e) {
      /* no voice on this device */
    }
  }
  if (RECORDED_CLIPS.size && typeof Audio !== "undefined") {
    try {
      clipPlayer = clipPlayer || new Audio();
      clipPlayer.src = SILENT_WAV;
      clipPlayer.play().catch(() => {});
    } catch (e) {
      /* no audio element */
    }
  }
}

function speakTts(text, onDone, queue) {
  if (!("speechSynthesis" in window)) return onDone?.();
  try {
    if (!queue) window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    }
    // Good voices sound natural near normal speed; slowing them down is what
    // makes them sound mechanical. Still a touch slow for following along.
    u.rate = 0.95;
    u.onend = () => onDone?.();
    u.onerror = () => onDone?.();
    window.speechSynthesis.speak(u);
  } catch (e) {
    onDone?.();
  }
}

// Speaks one line; calls onDone once when it is finished or has failed.
// `queue` lets "Switch sides." wait behind a line still being spoken.
function speakLine(clipKey, text, onDone, queue = false) {
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      onDone?.();
    }
  };
  if (clipKey && RECORDED_CLIPS.has(clipKey) && typeof Audio !== "undefined") {
    try {
      clipPlayer = clipPlayer || new Audio();
      const p = clipPlayer;
      if (queue && !p.paused && !p.ended) {
        const prev = p.onended;
        p.onended = () => {
          prev?.();
          speakLine(clipKey, text, onDone);
        };
        return;
      }
      p.onended = finish;
      p.onerror = () => speakTts(text, finish);
      p.src = `${import.meta.env.BASE_URL}voice/${clipKey}.mp3`;
      p.play().catch(() => speakTts(text, finish));
      return;
    } catch (e) {
      /* fall through to TTS */
    }
  }
  speakTts(text, finish, queue);
}

function stopVoice() {
  try {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (clipPlayer) {
      clipPlayer.onended = null;
      clipPlayer.pause();
    }
  } catch (e) {
    /* nothing playing */
  }
}

// Cheers, crowns, points and the quest start over every Monday (team time),
// so a player who joins mid-season, or had a slow week, isn't locked out of
// the top of the board by whoever started first.
function weekStartKey(key = todayKey()) {
  const dow = new Date(`${key}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  return shiftKey(key, (dow + 6) % 7);
}
function getThisWeekDays() {
  const today = todayKey();
  const start = weekStartKey(today);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const k = shiftKey(today, i);
    if (k < start) break;
    days.push(k);
  }
  return days;
}
const inThisWeek = (ts) => dateKey(new Date(ts)) >= weekStartKey();

// Personal streak badges (private, shown only on my own screen)
const STREAK_BADGES = [
  { min: 3, label: "3-Day Streak", emoji: "🔥" },
  { min: 7, label: "Full Week", emoji: "🏅" },
  { min: 14, label: "Legend Streak", emoji: "⭐" },
];
function getStreakBadge(streak) {
  let earned = null;
  for (const b of STREAK_BADGES) if (streak >= b.min) earned = b;
  return earned;
}

// Crown tiers based on number of cheer messages sent — every 5, the crown grows
const CROWN_TIERS = [
  { min: 5, label: "Bronze Crown", size: 16 },
  { min: 10, label: "Silver Crown", size: 22 },
  { min: 15, label: "Gold Crown", size: 28 },
  { min: 20, label: "Platinum Crown", size: 34 },
  { min: 25, label: "THE CROWN · Final Tier", size: 42 },
];
function getCrownInfo(cheerCount) {
  let tierIndex = -1;
  for (let i = 0; i < CROWN_TIERS.length; i++) {
    if (cheerCount >= CROWN_TIERS[i].min) tierIndex = i;
  }
  const current = tierIndex >= 0 ? CROWN_TIERS[tierIndex] : null;
  const next = tierIndex + 1 < CROWN_TIERS.length ? CROWN_TIERS[tierIndex + 1] : null;
  return { current, next, tierIndex };
}

// Coach Brooks' rotating shoutout lines — same one shows for everyone on a given day
const COACH_QUOTES = [
  "That's championship-level teamwork right there.",
  "This is exactly the effort I want to see every week.",
  "Proud of how this team shows up for each other.",
  "Keep this up and nobody's stopping this squad.",
  "This is what a real team looks like. Nice work.",
];
function getCoachQuote() {
  const epochDay = Math.floor(Date.now() / 86400000);
  return COACH_QUOTES[epochDay % COACH_QUOTES.length];
}

function computeChallengeProgress(players, cheers, aggregateCheckins) {
  const days = getThisWeekDays();
  const total = Math.max(players.length, 1);
  const weeklyCheers = cheers.filter((c) => days.includes(dateKey(new Date(c.ts)))).length;
  const cheerTarget = Math.max(total * 2, 4);
  const weeklyCheckins = days.reduce((sum, d) => sum + (aggregateCheckins[d] || 0), 0);
  const checkinTarget = Math.max(total * 3, 6);
  const crownClub = players.filter((p) => cheers.filter((c) => c.from === p && inThisWeek(c.ts)).length >= 5).length;
  const crownTarget = Math.max(Math.ceil(total / 2), 1);
  const allComplete = weeklyCheers >= cheerTarget && weeklyCheckins >= checkinTarget && crownClub >= crownTarget;
  return { weeklyCheers, cheerTarget, weeklyCheckins, checkinTarget, crownClub, crownTarget, allComplete };
}

function getWeeklyCheckinBuckets(aggregateCheckins, weeksBack = 12) {
  const buckets = [];
  const today = todayKey();
  for (let w = weeksBack - 1; w >= 0; w--) {
    let sum = 0;
    for (let d = 0; d < 7; d++) {
      sum += aggregateCheckins[shiftKey(today, w * 7 + d)] || 0;
    }
    buckets.push(sum);
  }
  return buckets;
}

function loadDefaultTeamState() {
  return {
    players: [], // jersey numbers as strings, e.g. "27"
    avatarStyles: {}, // { "27": { glasses, furStyle, sockColor } }
    aggregateCheckins: {}, // { "2026-08-03": 7 } — count only, no identity
    dailyStretches: {}, // { "2026-08-03": 5 } — count only, no identity
    cheers: [], // { from, to, message, ts }
    socialPoints: {}, // earned only from cheering, never from check-ins
    soccerProgress: {}, // { "27": 2 } — highest Soccer Challenge Series level this player has cleared
    schedule: [], // { id, opponent, date, time, location, homeAway, result }
    seasonSeed: null, // which SEASON_ID has already been merged into schedule
    coachInbox: [], // { id, message, ts } — fully anonymous, no sender attached
    teamWall: [], // { id, from, message, ts } — public team-wide shoutouts, visible to everyone
    week: weekStartKey(), // Monday the current points/quest progress belong to
    kudos: [], // { id, icon, ts } — no sender, no target, never counted
    // mindWall is intentionally gone: an unmoderated anonymous wall between
    // minors needed an adult in the loop that this app cannot provide, and it
    // promised an anonymity that timestamps on a 15-player squad cannot keep.
    // The coach inbox still carries anything heavy, to someone who can act.
  };
}

function loadDefaultPersonalLog() {
  return {}; // { "2026-08-03": { mood } }
}

// The coach's word, stored only as a SHA-256 of its normalized form so the
// public repo and the bundle don't spell it out. Still a doorbell, not a
// lock: the data itself is readable with the public Supabase key.
const COACH_WORD_SHA256 = "4c640a3e8038e5236872b7143b5250cc6695354cb044ba8281550916fcc1b82d";
const normalizeWord = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Cleans up whatever is stored (older formats included) into the current shape.
function mergeTeamState(teamState) {
  const merged = { ...loadDefaultTeamState(), ...teamState };
  const isNumeric = (p) => /^[0-9]+$/.test(p);
  merged.players = merged.players.filter(isNumeric);
  merged.cheers = merged.cheers.filter((c) => isNumeric(c.from) && (c.to === "team" || isNumeric(c.to)));
  merged.socialPoints = Object.fromEntries(Object.entries(merged.socialPoints).filter(([k]) => isNumeric(k)));
  merged.avatarStyles = Object.fromEntries(Object.entries(merged.avatarStyles).filter(([k]) => isNumeric(k)));
  if (merged.seasonSeed !== SEASON_ID) {
    const existing = new Set((merged.schedule || []).map((g) => g.id));
    merged.schedule = [...(merged.schedule || []), ...SEASON_SCHEDULE.filter((g) => !existing.has(g.id))];
    merged.seasonSeed = SEASON_ID;
  }
  // First load in a new week wipes the week's points and quest progress; the
  // next save writes that back for everyone. Cheers stay (they're filtered
  // to this week when shown and counted).
  const thisWeek = weekStartKey();
  if (teamState.week !== thisWeek) {
    merged.week = thisWeek;
    merged.socialPoints = {};
    merged.soccerProgress = {};
  }
  return merged;
}

async function safeGet(key, shared) {
  try {
    const res = await window.storage.get(key, shared);
    return res ? JSON.parse(res.value) : null;
  } catch (e) {
    return null;
  }
}
async function safeSet(key, value, shared) {
  try {
    await window.storage.set(key, JSON.stringify(value), shared);
  } catch (e) {
    console.error("storage set failed", e);
  }
}

export default function TeamLineupApp() {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState(null);
  const [coach, setCoach] = useState(false);
  const [team, setTeam] = useState(loadDefaultTeamState());
  const [myLog, setMyLog] = useState(loadDefaultPersonalLog());
  const [myStretchLog, setMyStretchLog] = useState({});
  const [tab, setTab] = useState("checkin");
  const [mood, setMood] = useState(null);
  const [cheerMsg, setCheerMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showBurst, setShowBurst] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const missionCelebratedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const myName = await safeGet("my-nickname", false);
      const log = await safeGet("my-checkin-log", false);
      const stretchLog = await safeGet("my-stretch-log", false);
      const teamState = await safeGet("lineup-team-state", true);
      // If this device's saved identity is a leftover free-text nickname from
      // before the jersey-number system, treat it as not-joined so onboarding
      // (number → avatar → stretch) runs again with a real number.
      const savedNumber = myName && /^[0-9]+$/.test(myName) ? myName : null;
      if (log) setMyLog(log);
      if (stretchLog) setMyStretchLog(stretchLog);
      if ((await safeGet("coach-mode", false)) === true) setCoach(true);
      if (teamState) {
        const merged = mergeTeamState(teamState);
        setTeam(merged);
        // A number the team no longer lists (the roster was reset, or it was
        // released) would be a ghost player: in the app but not on the team.
        // Send this device through sign-up again instead.
        if (savedNumber && merged.players.includes(savedNumber)) setMe(savedNumber);
      } else {
        setTeam({ ...loadDefaultTeamState(), schedule: [...SEASON_SCHEDULE], seasonSeed: SEASON_ID });
        if (savedNumber) setMe(savedNumber);
      }
      setReady(true);
    })();
  }, []);

  const persistTeam = useCallback(async (next) => {
    setTeam(next);
    setSaving(true);
    await safeSet("lineup-team-state", next, true);
    setSaving(false);
  }, []);

  const persistMyLog = useCallback(async (next) => {
    setMyLog(next);
    await safeSet("my-checkin-log", next, false);
  }, []);

  const persistMyStretchLog = useCallback(async (next) => {
    setMyStretchLog(next);
    await safeSet("my-stretch-log", next, false);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    if (!me) return;
    const progress = computeChallengeProgress(team.players, team.cheers, team.aggregateCheckins);
    if (progress.allComplete && !missionCelebratedRef.current) {
      missionCelebratedRef.current = true;
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 1100);
      showToast(`🛡️ Coach Brooks: "${getCoachQuote()}"`);
    }
    if (!progress.allComplete) missionCelebratedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.cheers, team.aggregateCheckins, team.players, me]);

  const getMyStreak = (log) => {
    let streak = 0;
    let key = todayKey();
    while (log[key] && streak < 3650) {
      streak += 1;
      key = shiftKey(key, 1);
    }
    return streak;
  };

  // Called once, at the end of onboarding: registers the player, saves their
  // avatar style, logs today's stretch, and optionally sends a first cheer.
  const finishOnboarding = async ({ number, avatarStyle }) => {
    if (!number) return "Pick a number first.";
    if (team.players.includes(number)) return `#${number} was just taken — pick another one.`;
    await safeSet("my-nickname", number, false);
    setMe(number);

    const todayStretchLog = { ...myStretchLog, [todayKey()]: true };
    await persistMyStretchLog(todayStretchLog);

    const next = {
      ...team,
      players: [...team.players, number],
      avatarStyles: { ...team.avatarStyles, [number]: avatarStyle },
      socialPoints: { ...team.socialPoints, [number]: team.socialPoints[number] || 0 },
      dailyStretches: { ...team.dailyStretches, [todayKey()]: (team.dailyStretches[todayKey()] || 0) + 1 },
    };
    await persistTeam(next);
    return null;
  };

  // Clears this device's saved identity so onboarding runs again with a
  // fresh number — useful while testing, or if a device gets handed to a
  // different teammate later in the season.
  const switchPlayer = async () => {
    const leaving = me;
    await safeSet("my-nickname", null, false);
    await safeSet("my-checkin-log", {}, false);
    await safeSet("my-stretch-log", {}, false);
    // Release the number. Points and cheer history stay keyed to it, so
    // rejoining with the same number picks up where they left off.
    if (leaving) {
      await persistTeam({ ...team, players: team.players.filter((p) => p !== leaving) });
    }
    setMe(null);
    setMyLog({});
    setMyStretchLog({});
  };

  // Update just this player's avatar look — keeps number and all history intact.
  const updateAvatarStyle = async (newStyle) => {
    const next = { ...team, avatarStyles: { ...team.avatarStyles, [me]: newStyle } };
    await persistTeam(next);
  };

  const submitCheckin = async () => {
    if (!mood || !me) return;
    const key = todayKey();
    if (myLog[key]) return;
    const nextLog = { ...myLog, [key]: { mood, ts: Date.now() } };
    await persistMyLog(nextLog);
    const next = { ...team, aggregateCheckins: { ...team.aggregateCheckins, [key]: (team.aggregateCheckins[key] || 0) + 1 } };
    await persistTeam(next);
    setMood(null);
    showToast(`Checked in! ${getMyStreak(nextLog)}-day streak`);
  };

  const submitStretch = async () => {
    if (!me) return;
    const key = todayKey();
    if (myStretchLog[key]) return;
    const nextLog = { ...myStretchLog, [key]: true };
    await persistMyStretchLog(nextLog);
    const next = { ...team, dailyStretches: { ...team.dailyStretches, [key]: (team.dailyStretches[key] || 0) + 1 } };
    await persistTeam(next);
    showToast("🛡️ Stretch logged — nice work!");
  };

  // Penalty Shootout bonus mini-game — fun, unlimited plays, small point reward on a goal
  // Soccer Challenge Series — records the highest level cleared and awards
  // points once per level (replaying an already-cleared level doesn't re-pay).
  const passLevel = async (levelId, reward) => {
    if (!me) return;
    const progress = team.soccerProgress || {};
    const current = progress[me] || 0;
    const alreadyPassed = current >= levelId;
    const next = {
      ...team,
      soccerProgress: { ...progress, [me]: Math.max(current, levelId) },
      socialPoints: alreadyPassed ? team.socialPoints : { ...team.socialPoints, [me]: (team.socialPoints[me] || 0) + reward },
    };
    await persistTeam(next);
  };

  // Team schedule — shared, anyone on the team can add a game or fill in a result afterward
  const addGame = async (game) => {
    const next = {
      ...team,
      schedule: [...(team.schedule || []), { id: `g${Date.now()}`, result: null, ...game }],
    };
    await persistTeam(next);
  };

  const addGameResult = async (gameId, result) => {
    const next = {
      ...team,
      schedule: (team.schedule || []).map((g) => (g.id === gameId ? { ...g, result } : g)),
    };
    await persistTeam(next);
  };

  // Anonymous message to the coach — intentionally carries no sender identity at all
  const sendCoachMessage = async (message) => {
    if (!message.trim()) return;
    const next = {
      ...team,
      coachInbox: [{ id: `m${Date.now()}`, message: message.trim(), ts: Date.now() }, ...(team.coachInbox || [])].slice(0, 200),
    };
    await persistTeam(next);
  };

  // Coach view: its own door, no player number, so the coach never lands on
  // the roster or the ranking, and is the only screen that lists the inbox.
  const coachSignIn = async (word) => {
    if ((await sha256Hex(normalizeWord(word))) !== COACH_WORD_SHA256) return "That's not the coach word.";
    await safeSet("coach-mode", true, false);
    setCoach(true);
    return null;
  };
  const coachSignOut = async () => {
    await safeSet("coach-mode", false, false);
    setCoach(false);
  };
  // Shared state is otherwise read once at launch; the coach needs new
  // inbox messages without closing the app.
  const reloadTeam = async () => {
    const teamState = await safeGet("lineup-team-state", true);
    if (teamState) setTeam(mergeTeamState(teamState));
  };

  // Team Wall — public shoutout board, visible to the whole team (not anonymous, unlike the coach inbox)
  const author = coach ? "coach" : me;
  const postToWall = async (message) => {
    if (!message.trim() || !author) return;
    const next = {
      ...team,
      teamWall: [{ id: `w${Date.now()}`, from: author, message: message.trim(), replies: [], ts: Date.now() }, ...(team.teamWall || [])].slice(0, 200),
      socialPoints: coach ? team.socialPoints : { ...team.socialPoints, [me]: (team.socialPoints[me] || 0) + 1 },
    };
    await persistTeam(next);
  };

  const replyToWall = async (postId, reply) => {
    if (!reply.trim() || !author) return;
    const next = {
      ...team,
      teamWall: (team.teamWall || []).map((p) =>
        p.id === postId ? { ...p, replies: [...(p.replies || []), { id: `wr${Date.now()}`, from: author, message: reply.trim(), ts: Date.now() }] } : p
      ),
    };
    await persistTeam(next);
  };

  // Cheers go to the whole team rather than one number: the numbers are
  // made up, so nobody knows who #7 is, and cheering a stranger is awkward.
  // Returns true when the cheer went out, so the tab can clear its icon pick.
  const sendCheer = async (icon) => {
    if ((!cheerMsg.trim() && !icon) || !me) return false;
    const today = todayKey();
    const myToday = team.cheers.filter((c) => c.from === me && dateKey(new Date(c.ts)) === today);
    if (myToday.length >= CHEER_DAILY_LIMIT) {
      showToast(`That's ${CHEER_DAILY_LIMIT} cheers today — send more tomorrow!`);
      return false;
    }
    const prevCount = team.cheers.filter((c) => c.from === me && inThisWeek(c.ts)).length;
    const nextCount = prevCount + 1;
    const next = {
      ...team,
      cheers: [{ from: me, to: "team", message: cheerMsg.trim(), ...(icon ? { icon } : {}), ts: Date.now() }, ...team.cheers].slice(0, 500),
      socialPoints: { ...team.socialPoints, [me]: (team.socialPoints[me] || 0) + 3 },
    };
    await persistTeam(next);
    setCheerMsg("");
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 1100);
    const leveledUp = CROWN_TIERS.find((t) => t.min === nextCount);
    if (leveledUp) playCrownSound();
    showToast(leveledUp ? `👑 ${leveledUp.label} unlocked!` : "Cheer sent to the team!");
    return true;
  };

  if (!ready) return <ShellFonts><LoadingScreen /></ShellFonts>;

  if (coach) {
    return (
      <ShellFonts>
        <CoachView
          team={team}
          onSignOut={coachSignOut}
          onRefresh={reloadTeam}
          onAddGame={addGame}
          onAddResult={addGameResult}
          onPostWall={postToWall}
          onReplyWall={replyToWall}
        />
      </ShellFonts>
    );
  }

  if (!me) {
    return (
      <ShellFonts>
        <Onboarding takenNumbers={team.players} onComplete={finishOnboarding} onCoachSignIn={coachSignIn} />
      </ShellFonts>
    );
  }

  const todayCount = team.aggregateCheckins[todayKey()] || 0;
  const totalPlayers = Math.max(team.players.length, 1);
  const teamPct = Math.round((todayCount / totalPlayers) * 100);
  // Challenge no longer gates on check-in rate — check-in is optional and
  // shouldn't block access to the games/goals people actually open the app for.
  const challengeUnlocked = true;
  const alreadyCheckedInToday = !!myLog[todayKey()];
  const alreadyStretchedToday = !!myStretchLog[todayKey()];
  const myStreak = getMyStreak(myLog);
  const stretchCountToday = team.dailyStretches[todayKey()] || 0;
  const myAvatarStyle = team.avatarStyles[me] || {};

  return (
    <ShellFonts>
      <div style={styles.app}>
        <Header me={me} myStreak={myStreak} saving={saving} avatarStyle={myAvatarStyle} onSwitchPlayer={switchPlayer} onOpenProfile={() => setShowProfile(true)} />
        <LineupBoard total={team.players.length} filled={todayCount} />
        <div style={styles.content}>
          {tab === "checkin" && (
            <CheckinTab
              mood={mood}
              setMood={setMood}
              onSubmit={submitCheckin}
              done={alreadyCheckedInToday}
              streak={myStreak}
              stretchDone={alreadyStretchedToday}
              stretchCount={stretchCountToday}
              totalPlayers={team.players.length}
              onStretch={submitStretch}
              avatarStyle={myAvatarStyle}
            />
          )}
          {tab === "cheer" && (
            <CheerTab
              me={me}
              cheers={team.cheers}
              cheerMsg={cheerMsg}
              setCheerMsg={setCheerMsg}
              onSend={sendCheer}
            />
          )}
          {tab === "challenge" && (
            <ChallengeTab
              players={team.players}
              cheers={team.cheers}
              aggregateCheckins={team.aggregateCheckins}
              unlocked={challengeUnlocked}
              teamPct={teamPct}
              me={me}
              soccerProgress={team.soccerProgress || {}}
              onPassLevel={passLevel}
            />
          )}
          {tab === "board" && (
            <LeaderboardTab
              points={team.socialPoints}
              players={team.players}
              cheers={team.cheers}
              avatarStyles={team.avatarStyles}
              aggregateCheckins={team.aggregateCheckins}
            />
          )}
          {tab === "team" && (
            <TeamTab
              schedule={team.schedule || []}
              onAddGame={addGame}
              onAddResult={addGameResult}
              onSendCoachMessage={sendCoachMessage}
              teamWall={team.teamWall || []}
              me={me}
              onPostWall={postToWall}
              onReplyWall={replyToWall}
            />
          )}
        </div>
        <TabBar tab={tab} setTab={setTab} />
        {toast && <Toast text={toast} />}
        <BalloonBurst show={showBurst} />
        <FloatingBadge todayCount={todayCount} totalPlayers={team.players.length} onTap={() => setTab("board")} />
        {showProfile && (
          <ProfileModal
            number={me}
            avatarStyle={myAvatarStyle}
            onSave={(style) => {
              updateAvatarStyle(style);
              setShowProfile(false);
            }}
            onClose={() => setShowProfile(false)}
          />
        )}
      </div>
      <div style={styles.footerNote}>Coached by {COACH_NAME}</div>
    </ShellFonts>
  );
}

/* ── Shell / Fonts ─────────────────────────── */

function ShellFonts({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{`
        @import url('${FONT_IMPORT_URL}');
        :root {
          --bg: #10151A;
          --bg-elev: #171F26;
          --bg-elev2: #1D2833;
          --turf: #5FA85A;
          --turf-bright: #7FCB6E;
          --chalk: #F1EFE7;
          --chalk-dim: #93A0A8;
          --amber: #F2A93B;
          --sky: #7FA8C9;
          --line: rgba(241,239,231,0.08);
          --danger: #D9705C;
        }
        * { box-sizing: border-box; }
        body, .lineup-root { font-family: 'Inter', sans-serif; }
        .lineup-display { font-family: 'Anton', sans-serif; letter-spacing: 0.02em; }
        .lineup-mono { font-family: 'Space Mono', monospace; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }
        @keyframes runnerBob { from { transform: translateY(0); } to { transform: translateY(-4px); } }
        @keyframes runnerLegs { from { transform: translateX(-1.5px); } to { transform: translateX(1.5px); } }
        @keyframes mascotBob { from { transform: translateY(0); } to { transform: translateY(-6px); } }
        @keyframes mascotWave { from { transform: rotate(-10deg); } to { transform: rotate(25deg); } }
        @keyframes stretchTorso {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          50% { transform: rotate(0deg) scaleY(1.06) translateY(-2px); }
          75% { transform: rotate(5deg); }
        }
        @keyframes stretchArmRight {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(-150deg); }
          50% { transform: rotate(-95deg); }
          75% { transform: rotate(-20deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes stretchArmLeft {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          50% { transform: rotate(95deg); }
          75% { transform: rotate(150deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes cardPop {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes kudosBob { from { transform: translateY(0); } to { transform: translateY(-7px); } }
        @keyframes balloonRise {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          15% { opacity: 1; }
          70% { transform: translateY(-160px) scale(1.05); opacity: 1; }
          85% { transform: translateY(-190px) scale(1.35); opacity: 1; }
          100% { transform: translateY(-195px) scale(0); opacity: 0; }
        }
      `}</style>
      <div className="lineup-root">{children}</div>
    </div>
  );
}

/* ── Bear Avatar (jersey number identity, customizable) ── */

function PlayerAvatar({ number, size = 40, waving = false, stretching = false, manualPose = null, glasses = false, furStyle = "smooth", bow = false, bowColor = "#F5A9C8", skinTone = "#E0A978", hairColor = "#5C3A21", sockColor = null, color = "var(--turf-bright)" }) {
  const torsoStyle = manualPose
    ? { transform: `rotate(${manualPose.torso}deg)`, transformOrigin: "40px 64px", transition: "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)" }
    : stretching
    ? { animation: "stretchTorso 3.2s ease-in-out infinite", transformOrigin: "40px 64px" }
    : {};
  const armRStyle = manualPose
    ? { transform: `rotate(${manualPose.armR}deg)`, transformOrigin: "60px 28px", transition: "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)" }
    : stretching
    ? { animation: "stretchArmRight 3.2s ease-in-out infinite", transformOrigin: "60px 30px" }
    : waving
    ? { animation: "mascotWave 0.6s ease-in-out infinite alternate", transformOrigin: "63px 38px" }
    : {};
  const armLStyle = manualPose
    ? { transform: `rotate(${manualPose.armL}deg)`, transformOrigin: "20px 28px", transition: "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)" }
    : stretching
    ? { animation: "stretchArmLeft 3.2s ease-in-out infinite", transformOrigin: "20px 30px" }
    : {};
  // Legs only move when a pose asks them to, so every pose written before
  // they were posable still renders exactly as it did.
  const legRStyle = manualPose?.legR
    ? { transform: `rotate(${manualPose.legR}deg)`, transformOrigin: "47.5px 60px", transition: "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)" }
    : {};
  const legLStyle = manualPose?.legL
    ? { transform: `rotate(${manualPose.legL}deg)`, transformOrigin: "32.5px 60px", transition: "transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)" }
    : {};

  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 80 88" style={{ flexShrink: 0, overflow: "visible" }}>
      <ellipse cx="40" cy="84" rx="20" ry="3" fill="rgba(0,0,0,0.18)" />
      <g style={legLStyle}>
        <rect x="28" y="58" width="9" height="20" rx="4" fill="#2b2f33" />
        {sockColor && <rect x="28" y="69" width="9" height="8" rx="3" fill={sockColor} />}
      </g>
      <g style={legRStyle}>
        <rect x="43" y="58" width="9" height="20" rx="4" fill="#2b2f33" />
        {sockColor && <rect x="43" y="69" width="9" height="8" rx="3" fill={sockColor} />}
      </g>
      <g style={torsoStyle}>
        <rect x="18" y="34" width="44" height="32" rx="14" fill={color} />
        <text x="40" y="55" textAnchor="middle" fontFamily="Space Mono, monospace" fontWeight="700" fontSize="15" fill="#10151A">
          {number}
        </text>
        <g style={armRStyle}>
          <rect x="58" y="24" width="11" height="30" rx="5.5" fill={skinTone} />
        </g>
        <g style={armLStyle}>
          <rect x="11" y="38" width="11" height="28" rx="5.5" fill={skinTone} />
        </g>

        {/* ponytail sits behind the head */}
        {furStyle === "ponytail" && (
          <ellipse cx="66" cy="19" rx="5" ry="12" fill={hairColor} transform="rotate(20 66 19)" />
        )}

        {/* head */}
        <circle cx="40" cy="20" r="18" fill={skinTone} />

        {/* hair cap covering the top/sides of the head */}
        <path d="M22 20 Q20 2 40 2 Q60 2 58 20 Q58 10 40 9 Q22 10 22 20 Z" fill={hairColor} />
        {furStyle === "curly" && (
          <>
            <circle cx="25" cy="9" r="5" fill={hairColor} />
            <circle cx="40" cy="4" r="5.5" fill={hairColor} />
            <circle cx="55" cy="9" r="5" fill={hairColor} />
          </>
        )}
        {furStyle === "ponytail" && <path d="M56 14 Q60 10 58 20 L52 18 Z" fill={hairColor} />}

        {/* face */}
        <circle cx="40" cy="27" r="2" fill="#2b2f33" />
        <circle cx="33" cy="16" r="2" fill="#2b2f33" />
        <circle cx="47" cy="16" r="2" fill="#2b2f33" />
        <path d="M35 23 Q40 26 45 23" stroke="#8a5a3f" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />

        {glasses && (
          <g stroke="#2b2f33" strokeWidth="1.6" fill="none">
            <circle cx="33" cy="16" r="6" />
            <circle cx="47" cy="16" r="6" />
            <line x1="39" y1="16" x2="41" y2="16" />
          </g>
        )}
        {bow && (
          <g transform="translate(22 0) rotate(-12)">
            <path d="M0 4 L8 0 L8 8 Z" fill={bowColor} />
            <path d="M16 4 L8 0 L8 8 Z" fill={bowColor} />
            <circle cx="8" cy="4" r="2.4" fill={bowColor} />
          </g>
        )}
      </g>
    </svg>
  );
}

/* ── Onboarding wizard ─────────────────────── */

function LoadingScreen() {
  return (
    <div style={{ ...styles.center, height: "100vh" }}>
      <div style={{ color: "var(--chalk-dim)", fontSize: 16 }}>Getting the lineup ready…</div>
    </div>
  );
}

function NumberGrid({ takenNumbers, selected, onSelect }) {
  const numbers = Array.from({ length: 99 }, (_, i) => String(i + 1));
  return (
    <div style={styles.numberGrid}>
      {numbers.map((n) => {
        const taken = takenNumbers.includes(n) && n !== selected;
        const isSelected = selected === n;
        return (
          <button
            key={n}
            type="button"
            disabled={taken}
            aria-pressed={isSelected}
            onClick={() => onSelect(n)}
            style={{
              ...styles.numberCell,
              opacity: taken ? 0.25 : 1,
              borderColor: isSelected ? "var(--amber)" : "var(--line)",
              background: isSelected ? "rgba(242,169,59,0.15)" : "var(--bg-elev2)",
              color: isSelected ? "var(--amber)" : "var(--chalk-dim)",
              cursor: taken ? "not-allowed" : "pointer",
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function StepShell({ title, subtitle, children, footer, onBack }) {
  return (
    <div style={{ ...styles.center, minHeight: "100vh", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {onBack && (
          <button type="button" onClick={onBack} style={styles.backBtn}>
            ← Back
          </button>
        )}
        <div style={{ color: "var(--amber)", fontSize: 14, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textAlign: "center" }}>
          {TEAM_NAME}
        </div>
        {title && (
          <div className="lineup-display" style={{ fontSize: 30, color: "var(--chalk)", lineHeight: 1.15, marginBottom: 8, textAlign: "center" }}>
            {title}
          </div>
        )}
        {subtitle && <div style={{ color: "var(--chalk-dim)", fontSize: 16, marginBottom: 20, textAlign: "center" }}>{subtitle}</div>}
        {children}
        {footer && <div style={{ marginTop: 18 }}>{footer}</div>}
      </div>
    </div>
  );
}

function ColorSwatchRow({ colors, value, onChange, size = 30 }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{ width: size, height: size, borderRadius: "50%", background: c, border: value === c ? "3px solid var(--amber)" : "3px solid transparent", cursor: "pointer" }}
        />
      ))}
    </div>
  );
}

// A tabbed character-creator, like the old metaverse avatar editors (Face / Hair / Outfit),
// with a "randomize everything" button. Shared by onboarding and the My Avatar edit screen.
function AvatarCustomizer({
  glasses, setGlasses,
  furStyle, setFurStyle,
  bow, setBow,
  bowColor, setBowColor,
  skinTone, setSkinTone,
  hairColor, setHairColor,
  jerseyColor, setJerseyColor,
  sockColor, setSockColor,
}) {
  const [tab, setTab] = useState("face");

  const randomize = () => {
    setSkinTone(SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)]);
    setHairColor(HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)]);
    setFurStyle(["smooth", "curly", "ponytail"][Math.floor(Math.random() * 3)]);
    setGlasses(Math.random() < 0.5);
    const wantsBow = Math.random() < 0.5;
    setBow(wantsBow);
    if (wantsBow) setBowColor(SOCK_COLORS[Math.floor(Math.random() * SOCK_COLORS.length)]);
    setJerseyColor(SOCK_COLORS[Math.floor(Math.random() * SOCK_COLORS.length)]);
    setSockColor(SOCK_COLORS[Math.floor(Math.random() * SOCK_COLORS.length)]);
  };

  const tabs = [
    { key: "face", label: "😊 Face" },
    { key: "hair", label: "💇 Hair" },
    { key: "outfit", label: "👕 Outfit" },
  ];

  return (
    <div>
      <button onClick={randomize} style={{ ...styles.chip, width: "100%", marginBottom: 14, textAlign: "center", color: "var(--amber)", borderColor: "rgba(242,169,59,0.4)" }}>
        🎲 Randomize All
      </button>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "var(--bg-elev2)", borderRadius: 10, padding: 4 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              background: tab === t.key ? "var(--bg-elev)" : "transparent",
              color: tab === t.key ? "var(--amber)" : "var(--chalk-dim)",
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "face" && (
        <>
          <div style={{ color: "var(--chalk-dim)", fontSize: 14, marginBottom: 8 }}>Skin Tone</div>
          <ColorSwatchRow colors={SKIN_TONES} value={skinTone} onChange={setSkinTone} />
          <div style={{ color: "var(--chalk-dim)", fontSize: 14, margin: "18px 0 8px" }}>Glasses</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setGlasses(false)} style={{ ...styles.chip, flex: 1, borderColor: !glasses ? "var(--amber)" : "var(--line)", color: !glasses ? "var(--amber)" : "var(--chalk-dim)" }}>No Glasses</button>
            <button onClick={() => setGlasses(true)} style={{ ...styles.chip, flex: 1, borderColor: glasses ? "var(--amber)" : "var(--line)", color: glasses ? "var(--amber)" : "var(--chalk-dim)" }}>😎 Glasses</button>
          </div>
        </>
      )}

      {tab === "hair" && (
        <>
          <div style={{ color: "var(--chalk-dim)", fontSize: 14, marginBottom: 8 }}>Hair Color</div>
          <ColorSwatchRow colors={HAIR_COLORS} value={hairColor} onChange={setHairColor} />
          <div style={{ color: "var(--chalk-dim)", fontSize: 14, margin: "18px 0 8px" }}>Hair Style</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <button onClick={() => setFurStyle("smooth")} style={{ ...styles.chip, flex: 1, borderColor: furStyle === "smooth" ? "var(--amber)" : "var(--line)", color: furStyle === "smooth" ? "var(--amber)" : "var(--chalk-dim)" }}>Straight</button>
            <button onClick={() => setFurStyle("curly")} style={{ ...styles.chip, flex: 1, borderColor: furStyle === "curly" ? "var(--amber)" : "var(--line)", color: furStyle === "curly" ? "var(--amber)" : "var(--chalk-dim)" }}>Curly</button>
            <button onClick={() => setFurStyle("ponytail")} style={{ ...styles.chip, flex: 1, borderColor: furStyle === "ponytail" ? "var(--amber)" : "var(--line)", color: furStyle === "ponytail" ? "var(--amber)" : "var(--chalk-dim)" }}>Ponytail</button>
          </div>
          <div style={{ color: "var(--chalk-dim)", fontSize: 14, marginBottom: 8 }}>Hair Bow</div>
          <div style={{ display: "flex", gap: 8, marginBottom: bow ? 10 : 0 }}>
            <button onClick={() => setBow(false)} style={{ ...styles.chip, flex: 1, borderColor: !bow ? "var(--amber)" : "var(--line)", color: !bow ? "var(--amber)" : "var(--chalk-dim)" }}>No Bow</button>
            <button onClick={() => setBow(true)} style={{ ...styles.chip, flex: 1, borderColor: bow ? "var(--amber)" : "var(--line)", color: bow ? "var(--amber)" : "var(--chalk-dim)" }}>🎀 Bow</button>
          </div>
          {bow && <ColorSwatchRow colors={SOCK_COLORS} value={bowColor} onChange={setBowColor} size={26} />}
        </>
      )}

      {tab === "outfit" && (
        <>
          <div style={{ color: "var(--chalk-dim)", fontSize: 14, marginBottom: 8 }}>Jersey Color</div>
          <ColorSwatchRow colors={SOCK_COLORS} value={jerseyColor} onChange={setJerseyColor} />
          <div style={{ color: "var(--chalk-dim)", fontSize: 14, margin: "18px 0 8px" }}>Sock Color</div>
          <ColorSwatchRow colors={SOCK_COLORS} value={sockColor} onChange={setSockColor} />
        </>
      )}
    </div>
  );
}

function Onboarding({ takenNumbers, onComplete, onCoachSignIn }) {
  const [step, setStep] = useState(0);
  const [number, setNumber] = useState(null);
  const [glasses, setGlasses] = useState(false);
  const [furStyle, setFurStyle] = useState("smooth");
  const [bow, setBow] = useState(false);
  const [bowColor, setBowColor] = useState("#F5A9C8");
  const [skinTone, setSkinTone] = useState(SKIN_TONES[1]);
  const [hairColor, setHairColor] = useState(HAIR_COLORS[1]);
  const [sockColor, setSockColor] = useState(SCHOOL_GOLD);
  const [jerseyColor, setJerseyColor] = useState(SCHOOL_MAROON);
  const [stretchMode, setStretchMode] = useState(null); // "follow" | "pick"
  const [selectedMoves, setSelectedMoves] = useState([]);
  const [justDrawn, setJustDrawn] = useState([]);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const [countdown, setCountdown] = useState(3);
  const [stretchDone, setStretchDone] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [typed, setTyped] = useState("");
  const [coachWord, setCoachWord] = useState("");
  const [coachError, setCoachError] = useState(null);

  const avatarPreview = <PlayerAvatar number={number || "?"} size={100} glasses={glasses} furStyle={furStyle} bow={bow} bowColor={bowColor} skinTone={skinTone} hairColor={hairColor} sockColor={sockColor} color={jerseyColor} />;

  // "Pick your own moves" playback — holds each pose for 3s with a 3-2-1 countdown
  useEffect(() => {
    if (stretchMode !== "pick" || playingIndex < 0) return;
    if (playingIndex >= selectedMoves.length) {
      setStretchDone(true);
      return;
    }
    setCountdown(3);
    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    const advance = setTimeout(() => setPlayingIndex((i) => i + 1), 3000);
    return () => {
      clearInterval(tick);
      clearTimeout(advance);
    };
  }, [stretchMode, playingIndex, selectedMoves.length]);

  // "Follow along" playback — the full auto-loop for ~8 seconds
  useEffect(() => {
    if (stretchMode !== "follow") return;
    const t = setTimeout(() => setStretchDone(true), 8000);
    return () => clearTimeout(t);
  }, [stretchMode]);

  const toggleMove = (key) => {
    setSelectedMoves((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const pickGoodMix = () => {
    const remaining = STRETCH_MOVES.filter((m) => !selectedMoves.includes(m.key));
    const drawn = [...remaining].sort(() => Math.random() - 0.5).slice(0, 3).map((m) => m.key);
    setSelectedMoves((prev) => [...prev, ...drawn]);
    setJustDrawn(drawn);
    setTimeout(() => setJustDrawn([]), 1400);
  };

  const finish = async () => {
    const err = await onComplete({
      number,
      avatarStyle: { glasses, furStyle, bow, bowColor, skinTone, hairColor, sockColor, jerseyColor },
    });
    if (err) {
      setJoinError(err);
      setNumber(null);
      setStep(1);
    }
  };

  // Back from anywhere in the stretch step lands on its menu; back from the
  // menu (or from the last screen) goes to the step before it.
  const backToStretchMenu = () => {
    setStretchMode(null);
    setPlayingIndex(-1);
    setStretchDone(false);
  };

  if (step === 0) {
    return (
      <StepShell
        title="Welcome!"
        subtitle="Marianapolis Prep — Girls’ Soccer Junior Varsity. Go Knights!"
        footer={
          <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={() => setStep(1)}>
            Get Started
          </button>
        }
      >
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ animation: "mascotBob 1.4s ease-in-out infinite alternate", display: "inline-block" }}>
            <PlayerAvatar number="M" size={100} waving />
          </div>
        </div>
        <div style={{ ...styles.privacyNote, marginTop: 14 }}>
          🔒 Your mood is visible only to you. The team only sees anonymous counts — never who.
        </div>
        <button type="button" onClick={() => setStep("coach")} style={{ ...styles.skipBtn, marginTop: 10 }}>
          Coach? Sign in here
        </button>
      </StepShell>
    );
  }

  if (step === "coach") {
    const submitCoach = async (e) => {
      e.preventDefault();
      const err = await onCoachSignIn(coachWord);
      setCoachError(err);
    };
    return (
      <StepShell onBack={() => { setCoachError(null); setStep(0); }} title="Coach Sign-In" subtitle="Coaches don't pick a number, so you won't show up on the roster or the ranking.">
        <form onSubmit={submitCoach}>
          <input
            type="password"
            autoComplete="off"
            value={coachWord}
            onChange={(e) => { setCoachWord(e.target.value); setCoachError(null); }}
            placeholder="Coach word"
            style={{ ...styles.input, marginBottom: 10 }}
          />
          {coachError && <div style={{ color: "var(--danger)", fontSize: 15, textAlign: "center", marginBottom: 10 }}>{coachError}</div>}
          <button type="submit" disabled={!coachWord.trim()} style={{ ...styles.primaryBtn, width: "100%", opacity: coachWord.trim() ? 1 : 0.4 }}>
            Sign In
          </button>
        </form>
      </StepShell>
    );
  }

  if (step === 1) {
    const rollNumber = () => {
      const free = Array.from({ length: 99 }, (_, i) => String(i + 1)).filter((n) => !takenNumbers.includes(n) && n !== number);
      if (free.length) setNumber(free[Math.floor(Math.random() * free.length)]);
      setTyped("");
    };
    // A plain text field as a second way in: if the grid ever fails to take a
    // tap on some phone, typing still works, so nobody is stuck at sign-up.
    const typedNum = typed ? String(Number(typed)) : "";
    const typedProblem = !typed ? null : Number(typed) < 1 ? "Pick 1–99." : takenNumbers.includes(typedNum) ? `#${typedNum} is taken.` : null;
    const onType = (e) => {
      const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
      setTyped(digits);
      const n = digits ? String(Number(digits)) : "";
      if (n && Number(n) >= 1 && !takenNumbers.includes(n)) setNumber(n);
    };
    return (
      <StepShell
        onBack={() => setStep(0)}
        title="Pick a Player Number"
        subtitle="Any number you like — not your real jersey number. That way nobody can tell who's who."
        footer={
          <button
            style={{ ...styles.primaryBtn, width: "100%", opacity: number ? 1 : 0.4, cursor: number ? "pointer" : "not-allowed" }}
            disabled={!number}
            onClick={() => setStep(2)}
          >
            Next
          </button>
        }
      >
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <PlayerAvatar number={number || "?"} size={80} />
        </div>
        {joinError && (
          <div style={{ color: "var(--danger)", fontSize: 15, textAlign: "center", marginBottom: 10 }}>{joinError}</div>
        )}
        <button type="button" onClick={rollNumber} style={{ ...styles.chip, width: "100%", marginBottom: 12, textAlign: "center", color: "var(--amber)", borderColor: "rgba(242,169,59,0.4)", touchAction: "manipulation" }}>
          🎲 Pick one for me
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <label htmlFor="typed-number" style={{ color: "var(--chalk-dim)", fontSize: 14, whiteSpace: "nowrap" }}>Or type one:</label>
          <input
            id="typed-number"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={typed}
            onChange={onType}
            placeholder="1–99"
            style={{ ...styles.input, flex: 1, padding: "10px 14px", fontFamily: "'Space Mono', monospace", fontSize: 18 }}
          />
        </div>
        {typedProblem && <div style={{ color: "var(--danger)", fontSize: 14, textAlign: "center", marginTop: -6, marginBottom: 10 }}>{typedProblem}</div>}
        <NumberGrid takenNumbers={takenNumbers} selected={number} onSelect={(n) => { setNumber(n); setTyped(""); }} />
        <div style={{ color: "var(--chalk-dim)", fontSize: 13, textAlign: "center", marginTop: 8 }}>Grayed-out numbers are already taken.</div>
      </StepShell>
    );
  }

  if (step === 2) {
    return (
      <StepShell
        onBack={() => setStep(1)}
        title="Customize Your Character"
        subtitle="Face, hair, outfit — make it yours."
        footer={
          <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={() => setStep(4)}>
            Next
          </button>
        }
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>{avatarPreview}</div>
        <AvatarCustomizer
          glasses={glasses} setGlasses={setGlasses}
          furStyle={furStyle} setFurStyle={setFurStyle}
          bow={bow} setBow={setBow}
          bowColor={bowColor} setBowColor={setBowColor}
          skinTone={skinTone} setSkinTone={setSkinTone}
          hairColor={hairColor} setHairColor={setHairColor}
          jerseyColor={jerseyColor} setJerseyColor={setJerseyColor}
          sockColor={sockColor} setSockColor={setSockColor}
        />
      </StepShell>
    );
  }


  if (step === 4) {
    return (
      <StepShell
        onBack={() => setStep(2)}
        title={`Remember: #${number}`}
        subtitle="That's your number for the whole season. Keep it to yourself — that's what keeps check-ins and cheers anonymous."
        footer={
          <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={() => setStep(5)}>
            Got it!
          </button>
        }
      >
        <div style={{ textAlign: "center" }}>{avatarPreview}</div>
      </StepShell>
    );
  }

  if (step === 5) {
    if (!stretchMode) {
      return (
        <StepShell onBack={() => setStep(4)} title="Team Stretch" subtitle="Loosen up before we get going.">
          <div style={{ textAlign: "center", marginBottom: 20 }}>{avatarPreview}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button style={{ ...styles.primaryBtn }} onClick={() => setStretchMode("follow")}>
              Watch & Follow Along
            </button>
            <button style={{ ...styles.primaryBtn, background: "var(--sky)" }} onClick={() => setStretchMode("pick")}>
              Pick a Few Moves
            </button>
            <button style={{ ...styles.skipBtn }} onClick={() => setStep(6)}>
              Skip for now
            </button>
          </div>
        </StepShell>
      );
    }

    if (stretchMode === "follow") {
      return (
        <StepShell onBack={backToStretchMenu} title={stretchDone ? "Nice work!" : "Follow Along"} subtitle={stretchDone ? "That's a stretch — you're all set." : "Just copy the bear."}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <PlayerAvatar number={number} size={120} stretching={!stretchDone} glasses={glasses} furStyle={furStyle} sockColor={sockColor} />
          </div>
          <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={() => (stretchDone ? setStep(6) : setStretchDone(true))}>
            {stretchDone ? "Next" : "Done Stretching"}
          </button>
        </StepShell>
      );
    }

    // "pick" mode
    if (playingIndex < 0) {
      return (
        <StepShell onBack={backToStretchMenu} title="Pick a Few Moves" subtitle="Choose the stretches you want to try — pick just one, or a few for variety.">
          <div style={{ textAlign: "center", marginBottom: 16 }}>{avatarPreview}</div>
          <button onClick={pickGoodMix} disabled={selectedMoves.length >= STRETCH_MOVES.length} style={{ ...styles.chip, width: "100%", marginBottom: 12, textAlign: "center", color: "var(--amber)", borderColor: "rgba(242,169,59,0.4)", opacity: selectedMoves.length >= STRETCH_MOVES.length ? 0.4 : 1 }}>
            🎴 Draw 3 Moves
          </button>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {STRETCH_MOVES.map((m) => (
              <button
                key={m.key}
                onClick={() => toggleMove(m.key)}
                style={{
                  ...styles.taskRow,
                  borderColor: selectedMoves.includes(m.key) ? "var(--turf-bright)" : "var(--line)",
                  animation: justDrawn.includes(m.key) ? `cardPop 0.5s ease-out ${justDrawn.indexOf(m.key) * 0.15}s backwards` : "none",
                }}
              >
                <span
                  style={{
                    width: 18, height: 18, borderRadius: 5,
                    border: `2px solid ${selectedMoves.includes(m.key) ? "var(--turf-bright)" : "var(--chalk-dim)"}`,
                    background: selectedMoves.includes(m.key) ? "var(--turf-bright)" : "transparent",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#10151A", flexShrink: 0,
                  }}
                >
                  {selectedMoves.includes(m.key) ? "✓" : ""}
                </span>
                <span style={{ flex: 1 }}>
                  <div style={{ color: "var(--chalk)", fontSize: 16, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginTop: 2 }}>{m.cue}</div>
                </span>
              </button>
            ))}
          </div>
          <button
            style={{ ...styles.primaryBtn, width: "100%", opacity: selectedMoves.length ? 1 : 0.4 }}
            disabled={!selectedMoves.length}
            onClick={() => setPlayingIndex(0)}
          >
            Start
          </button>
        </StepShell>
      );
    }
    if (stretchDone) {
      return (
        <StepShell onBack={backToStretchMenu} title="Nice work!" subtitle="That's a stretch — you're all set.">
          <div style={{ textAlign: "center", marginBottom: 20 }}>{avatarPreview}</div>
          <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={() => setStep(6)}>
            Next
          </button>
        </StepShell>
      );
    }
    const current = STRETCH_MOVES.find((m) => m.key === selectedMoves[playingIndex]);
    return (
      <StepShell onBack={() => setPlayingIndex(-1)} title={current?.label || "Stretching…"}>
        <div style={{ color: "var(--chalk-dim)", fontSize: 14, textAlign: "center", marginBottom: 8 }}>
          Move {playingIndex + 1} of {selectedMoves.length}
        </div>
        <div style={{ textAlign: "center" }}>
          <PlayerAvatar number={number} size={120} manualPose={current?.pose} glasses={glasses} furStyle={furStyle} sockColor={sockColor} />
        </div>
        <div className="lineup-display" style={{ textAlign: "center", fontSize: 32, color: "var(--amber)", margin: "8px 0" }}>
          {countdown > 0 ? countdown : "Go!"}
        </div>
        <div style={{ color: "var(--chalk-dim)", fontSize: 15, textAlign: "center" }}>{current?.cue}</div>
      </StepShell>
    );
  }

  // step 6 — done. There used to be a "send your first cheer" step here, but
  // a new player can't know who any number belongs to, so it's gone.
  return (
    <StepShell onBack={() => { backToStretchMenu(); setStep(5); }} title="You're in the Lineup!" subtitle="Check in, warm up, cheer the team on — see you on the field.">
      <div style={{ textAlign: "center", marginBottom: 20 }}>{avatarPreview}</div>
      <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={finish}>
        Enter the Lineup
      </button>
    </StepShell>
  );
}

/* ── Coach view ────────────────────────────── */

// Counts only, like everywhere else: the coach sees how many checked in, never
// who or what mood. The inbox is listed here and nowhere else.
function CoachView({ team, onSignOut, onRefresh, onAddGame, onAddResult, onPostWall, onReplyWall }) {
  const [refreshing, setRefreshing] = useState(false);
  // Same Monday-to-Sunday week as the players' mission, ranking and quest.
  const days = getThisWeekDays();
  const roster = team.players.length;
  const today = todayKey();
  const inbox = team.coachInbox || [];
  const maxCount = Math.max(1, roster, ...days.map((d) => team.aggregateCheckins[d] || 0));
  const dayLabel = (key) =>
    key === today ? "Today" : new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric", timeZone: "UTC" });

  const refresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div style={styles.app}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 18px 8px" }}>
        <div>
          <div style={{ color: "var(--amber)", fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>{TEAM_NAME}</div>
          <div className="lineup-display" style={{ fontSize: 26, color: "var(--chalk)" }}>Coach View</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <button onClick={refresh} style={{ ...styles.chip, padding: "6px 12px" }}>{refreshing ? "Refreshing…" : "↻ Refresh"}</button>
          <button onClick={onSignOut} style={{ ...styles.skipBtn, padding: 0, width: "auto", fontSize: 13 }}>Sign out</button>
        </div>
      </div>
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={{ color: "var(--chalk)", fontSize: 17, fontWeight: 700, marginBottom: 2 }}>📊 This Week</div>
          <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginBottom: 12 }}>
            {roster} player{roster === 1 ? "" : "s"} signed up. Counts only — moods and names are never sent anywhere.
          </div>
          {days.map((d) => {
            const c = team.aggregateCheckins[d] || 0;
            const s = team.dailyStretches[d] || 0;
            return (
              <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 70, color: d === today ? "var(--chalk)" : "var(--chalk-dim)", fontSize: 13, fontWeight: d === today ? 700 : 400 }}>{dayLabel(d)}</div>
                <div style={{ flex: 1, height: 10, borderRadius: 5, background: "var(--bg-elev2)", overflow: "hidden" }}>
                  <div style={{ width: `${(c / maxCount) * 100}%`, height: "100%", background: "var(--turf-bright)" }} />
                </div>
                <div className="lineup-mono" style={{ width: 92, textAlign: "right", color: "var(--chalk-dim)", fontSize: 12 }}>
                  ✅ {c} · 🧘 {s}
                </div>
              </div>
            );
          })}
          <div style={{ color: "var(--chalk-dim)", fontSize: 12, marginTop: 4 }}>✅ check-ins · 🧘 warm-ups</div>
        </div>

        <div style={{ ...styles.card, marginTop: 14 }}>
          <div style={{ color: "var(--chalk)", fontSize: 17, fontWeight: 700, marginBottom: 2 }}>📮 Anonymous Messages</div>
          <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginBottom: 12 }}>
            From players, with no name or number. Players can send these but can't read them. Tap Refresh to check for new ones.
          </div>
          {inbox.length === 0 ? (
            <div style={{ color: "var(--chalk-dim)", fontSize: 15 }}>No messages yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {inbox.slice(0, 50).map((m) => (
                <div key={m.id} style={styles.cheerRow}>
                  <div style={{ color: "var(--chalk-dim)", fontSize: 12, marginBottom: 3 }}>{m.ts ? timeAgo(m.ts) : ""}</div>
                  <div style={{ color: "var(--chalk)", fontSize: 16, lineHeight: 1.4, overflowWrap: "anywhere" }}>{m.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          <TeamTab
            schedule={team.schedule || []}
            onAddGame={onAddGame}
            onAddResult={onAddResult}
            teamWall={team.teamWall || []}
            me="coach"
            onPostWall={onPostWall}
            onReplyWall={onReplyWall}
            isCoach
          />
        </div>
      </div>
    </div>
  );
}

/* ── Header ────────────────────────────────── */

function Header({ me, myStreak, saving, avatarStyle, onSwitchPlayer, onOpenProfile }) {
  const badge = getStreakBadge(myStreak);
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (confirming) {
      onSwitchPlayer();
      setConfirming(false);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 4000);
    }
  };

  return (
    <div style={styles.header}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onOpenProfile} style={styles.avatarTapBtn} aria-label="View my bear">
          <PlayerAvatar number={me} size={46} glasses={avatarStyle.glasses} furStyle={avatarStyle.furStyle} bow={avatarStyle.bow} bowColor={avatarStyle.bowColor} skinTone={avatarStyle.skinTone} hairColor={avatarStyle.hairColor} sockColor={avatarStyle.sockColor} color={avatarStyle.jerseyColor || "var(--turf-bright)"} />
        </button>
        <div>
          <div style={{ color: "var(--chalk-dim)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
            {saving ? "Syncing…" : TEAM_NAME}
          </div>
          <div className="lineup-display" style={{ fontSize: 22, color: "var(--chalk)" }}>#{me}</div>
          {badge && (
            <div style={{ fontSize: 13, color: "var(--amber)", marginTop: 2 }}>
              {badge.emoji} {badge.label}
            </div>
          )}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="lineup-mono" style={{ fontSize: 20, color: "var(--amber)" }}>🔥 {myStreak}</div>
        <div style={{ color: "var(--chalk-dim)", fontSize: 12, marginBottom: 4 }}>your streak, private</div>
        <button onClick={handleClick} style={styles.switchPlayerBtn}>
          {confirming ? "Tap again to confirm" : "Switch Player"}
        </button>
      </div>
    </div>
  );
}

/* ── Profile Modal: "My Bear" — view & edit your look, number stays fixed ── */

function ProfileModal({ number, avatarStyle, onSave, onClose }) {
  const [glasses, setGlasses] = useState(!!avatarStyle.glasses);
  const [furStyle, setFurStyle] = useState(avatarStyle.furStyle || "smooth");
  const [bow, setBow] = useState(!!avatarStyle.bow);
  const [bowColor, setBowColor] = useState(avatarStyle.bowColor || "#F5A9C8");
  const [skinTone, setSkinTone] = useState(avatarStyle.skinTone || SKIN_TONES[1]);
  const [hairColor, setHairColor] = useState(avatarStyle.hairColor || HAIR_COLORS[1]);
  const [sockColor, setSockColor] = useState(avatarStyle.sockColor || SCHOOL_GOLD);
  const [jerseyColor, setJerseyColor] = useState(avatarStyle.jerseyColor || SCHOOL_MAROON);
  const [editing, setEditing] = useState(false);

  const colorName = (hex) => {
    const idx = SOCK_COLORS.indexOf(hex);
    const names = ["Maroon", "Knight Gold", "Chalk White", "Charcoal", "Amber", "Turf Green", "Sky Blue", "Coral", "Lavender", "Pink"];
    return names[idx] ?? "Custom";
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <PlayerAvatar number={number} size={110} glasses={glasses} furStyle={furStyle} bow={bow} bowColor={bowColor} skinTone={skinTone} hairColor={hairColor} sockColor={sockColor} color={jerseyColor} />
        </div>
        <div className="lineup-display" style={{ textAlign: "center", fontSize: 22, color: "var(--chalk)", marginBottom: 12 }}>
          #{number}
        </div>

        {!editing ? (
          <>
            <div style={styles.profileRow}><span>Glasses</span><span>{avatarStyle.glasses ? "On" : "Off"}</span></div>
            <div style={styles.profileRow}><span>Hair Style</span><span style={{ textTransform: "capitalize" }}>{avatarStyle.furStyle === "smooth" ? "straight" : avatarStyle.furStyle || "straight"}</span></div>
            <div style={styles.profileRow}><span>Hair Bow</span><span>{avatarStyle.bow ? colorName(avatarStyle.bowColor) : "Off"}</span></div>
            <div style={styles.profileRow}><span>Jersey Color</span><span>{colorName(avatarStyle.jerseyColor)}</span></div>
            <div style={styles.profileRow}><span>Sock Color</span><span>{colorName(avatarStyle.sockColor)}</span></div>
            <button style={{ ...styles.primaryBtn, width: "100%", marginTop: 16 }} onClick={() => setEditing(true)}>
              Edit Look
            </button>
            <button style={{ ...styles.skipBtn, marginTop: 6 }} onClick={onClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <AvatarCustomizer
              glasses={glasses} setGlasses={setGlasses}
              furStyle={furStyle} setFurStyle={setFurStyle}
              bow={bow} setBow={setBow}
              bowColor={bowColor} setBowColor={setBowColor}
              skinTone={skinTone} setSkinTone={setSkinTone}
              hairColor={hairColor} setHairColor={setHairColor}
              jerseyColor={jerseyColor} setJerseyColor={setJerseyColor}
              sockColor={sockColor} setSockColor={setSockColor}
            />
            <button style={{ ...styles.primaryBtn, width: "100%", marginTop: 18 }} onClick={() => onSave({ glasses, furStyle, bow, bowColor, skinTone, hairColor, sockColor, jerseyColor })}>
              Save
            </button>
            <button style={{ ...styles.skipBtn, marginTop: 6 }} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Signature: Team Track (anonymous runners) ── */

const RUNNER_COLORS = ["#F2A93B", "#7FCB6E", "#7FA8C9", "#E0A15B", "#D9705C", "#9AD1C9"];

function Runner({ color, delay }) {
  return (
    <div style={{ animation: `runnerBob 0.55s ease-in-out ${delay}s infinite alternate`, flexShrink: 0 }}>
      <svg width="30" height="34" viewBox="0 0 40 44">
        <ellipse cx="20" cy="41" rx="9" ry="2" fill="rgba(0,0,0,0.18)" />
        <g style={{ animation: `runnerLegs 0.4s ease-in-out ${delay}s infinite alternate`, transformOrigin: "20px 26px" }}>
          <rect x="13" y="25" width="4.5" height="11" rx="2.2" fill="#2b2f33" />
          <rect x="22.5" y="25" width="4.5" height="11" rx="2.2" fill="#2b2f33" />
        </g>
        <rect x="11" y="13" width="18" height="15" rx="6" fill={color} />
        <circle cx="20" cy="8" r="7.5" fill="#F0C29B" />
        <circle cx="17" cy="7" r="1.1" fill="#2b2f33" />
        <circle cx="23" cy="7" r="1.1" fill="#2b2f33" />
        <path d="M17 11 Q20 13 23 11" stroke="#2b2f33" strokeWidth="1" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function EmptySlot() {
  return (
    <svg width="30" height="34" viewBox="0 0 40 44" style={{ flexShrink: 0, opacity: 0.35 }}>
      <rect x="11" y="13" width="18" height="15" rx="6" fill="none" stroke="var(--chalk-dim)" strokeWidth="1.4" strokeDasharray="3 3" />
      <circle cx="20" cy="8" r="7.5" fill="none" stroke="var(--chalk-dim)" strokeWidth="1.4" strokeDasharray="3 3" />
    </svg>
  );
}

function LineupBoard({ total, filled }) {
  if (total === 0) {
    return <div style={styles.lineupBoardEmpty}>No teammates yet. Share this app's link with your team.</div>;
  }
  const slots = Array.from({ length: total }, (_, i) => i < filled);
  return (
    <div style={styles.lineupBoardWrap}>
      <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
        Today's Lineup Track · {filled}/{total} (anonymous)
      </div>
      <div style={styles.trackLane}>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", overflowX: "auto", paddingBottom: 2 }}>
          {slots.map((on, i) =>
            on ? <Runner key={i} color={RUNNER_COLORS[i % RUNNER_COLORS.length]} delay={(i % 4) * 0.12} /> : <EmptySlot key={i} />
          )}
          <div style={{ fontSize: 22, flexShrink: 0, marginLeft: 4 }}>🏁</div>
        </div>
      </div>
    </div>
  );
}

/* ── Balloon burst ─────────────────────────── */

function BalloonBurst({ show }) {
  if (!show) return null;
  const balloons = ["🎈", "🎈", "🎈", "🎈", "🎈"];
  return (
    <div style={styles.balloonOverlay}>
      {balloons.map((b, i) => (
        <span key={i} style={{ position: "absolute", left: `${8 + i * 20}%`, bottom: 60, fontSize: 32, animation: `balloonRise 1.1s ease-out ${i * 0.06}s forwards` }}>
          {b}
        </span>
      ))}
    </div>
  );
}

/* ── Check-in Tab (mood + team stretch) ───── */

function CheckinTab({ mood, setMood, onSubmit, done, streak, stretchDone, stretchCount, totalPlayers, onStretch, avatarStyle }) {
  const [showStretch, setShowStretch] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  return (
    <div>
      <div style={styles.card}>
        {done ? (
          <>
            <div className="lineup-display" style={{ fontSize: 26, color: "var(--turf-bright)" }}>Checked In</div>
            <div style={{ color: "var(--chalk-dim)", fontSize: 15, marginTop: 8 }}>
              You're all set for today. {streak}-day streak so far. (Only you can see this.)
            </div>
          </>
        ) : (
          <>
            <div style={styles.privacyNoteSmall}>🔒 What you pick here is visible to you only.</div>
            <div style={{ color: "var(--chalk-dim)", fontSize: 14, margin: "14px 0 8px" }}>How are you feeling today?</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMood(m.key)}
                  style={{ ...styles.moodBtn, borderColor: mood === m.key ? m.color : "var(--line)", background: mood === m.key ? `${m.color}22` : "var(--bg-elev2)", color: mood === m.key ? m.color : "var(--chalk-dim)" }}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button onClick={onSubmit} disabled={!mood} style={{ ...styles.primaryBtn, width: "100%", opacity: mood ? 1 : 0.4, cursor: mood ? "pointer" : "not-allowed" }}>
              Check In
            </button>
          </>
        )}
      </div>

      <div style={{ ...styles.card, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <PlayerAvatar number="" size={56} stretching={stretchDone} glasses={avatarStyle.glasses} furStyle={avatarStyle.furStyle} bow={avatarStyle.bow} bowColor={avatarStyle.bowColor} skinTone={avatarStyle.skinTone} hairColor={avatarStyle.hairColor} sockColor={avatarStyle.sockColor} color={avatarStyle.jerseyColor || "var(--sky)"} />
          <div style={{ flex: 1 }}>
            <div style={{ color: "var(--chalk)", fontSize: 17, fontWeight: 700 }}>🛡️ Team Stretch</div>
            <div style={{ color: "var(--chalk-dim)", fontSize: 14, marginTop: 2 }}>Pick a couple of moves and follow along — full screen, your own bear.</div>
          </div>
        </div>
        <div className="lineup-mono" style={{ color: "var(--chalk-dim)", fontSize: 14, marginTop: 10 }}>
          {stretchCount}/{Math.max(totalPlayers, 1)} stretched today
        </div>
        <button
          onClick={() => setShowStretch(true)}
          disabled={stretchDone}
          style={{ ...styles.primaryBtn, width: "100%", marginTop: 10, background: stretchDone ? "var(--bg-elev2)" : "var(--sky)", color: stretchDone ? "var(--chalk-dim)" : "#10151A", cursor: stretchDone ? "default" : "pointer" }}
        >
          {stretchDone ? "✓ Stretched today" : "Start Team Stretch"}
        </button>
        {stretchDone && (
          <button
            onClick={() => {
              setPracticeMode(true);
              setShowStretch(true);
            }}
            style={{ ...styles.skipBtn, marginTop: 8 }}
          >
            Replay for practice (won't count again)
          </button>
        )}
      </div>

      {showStretch && (
        <StretchPlayer
          avatarStyle={avatarStyle}
          onComplete={() => {
            if (!practiceMode) onStretch();
            setShowStretch(false);
            setPracticeMode(false);
          }}
          onClose={() => {
            setShowStretch(false);
            setPracticeMode(false);
          }}
        />
      )}
    </div>
  );
}

/* ── Stretch Player: full-screen move picker + follow-along ── */

const MIN_STRETCH_MOVES = 2;

function StretchPlayer({ avatarStyle, onComplete, onClose }) {
  const [selectedMoves, setSelectedMoves] = useState([]);
  const [justDrawn, setJustDrawn] = useState([]);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const [countdown, setCountdown] = useState(3);
  const [voiceOn, setVoiceOn] = useState(true);

  // A move ends when BOTH the voice has finished its sentence and the hold
  // time has run out. Either alone was the old bug: a fixed 3s timer cut
  // every sentence off mid-word, and left no time to actually stretch.
  const spokeRef = useRef(false);
  const heldRef = useRef(false);
  const advanceRef = useRef(null);
  // Read inside timers so muting mid-move doesn't restart the move.
  const voiceOnRef = useRef(voiceOn);

  useEffect(() => {
    voiceOnRef.current = voiceOn;
    if (!voiceOn) {
      stopVoice();
      // cancel() does not reliably fire onend, so muting must not strand a
      // move that is still waiting on the voice.
      spokeRef.current = true;
      if (advanceRef.current) advanceRef.current();
    }
  }, [voiceOn]);

  useEffect(() => {
    if (playingIndex < 0 || playingIndex >= selectedMoves.length) return;
    const move = STRETCH_MOVES.find((m) => m.key === selectedMoves[playingIndex]);
    if (!move) return;

    spokeRef.current = false;
    heldRef.current = false;
    setCountdown(move.hold);

    const advance = () => {
      if (spokeRef.current && heldRef.current) setPlayingIndex((i) => i + 1);
    };
    advanceRef.current = advance;

    playTone(660, 0, 0.18, "triangle", 0.12);

    if (voiceOnRef.current) {
      speakLine(move.key, move.say, () => {
        spokeRef.current = true;
        advance();
      });
    } else {
      spokeRef.current = true; // muted — the text carries it
    }

    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    const held = setTimeout(() => {
      heldRef.current = true;
      advance();
    }, move.hold * 1000);

    // Some browsers drop onend entirely (a backgrounded tab, a long
    // utterance). Without this the warm-up would sit on one move forever.
    const voiceCap = setTimeout(() => {
      spokeRef.current = true;
      advance();
    }, move.hold * 1000 + 15000);

    let midway;
    if (move.switchSides) {
      midway = setTimeout(() => {
        playTone(880, 0, 0.14, "triangle", 0.1);
        if (voiceOnRef.current) speakLine("switch", "Switch sides.", null, true); // queues behind the main line
      }, (move.hold / 2) * 1000);
    }

    return () => {
      clearInterval(tick);
      clearTimeout(held);
      clearTimeout(voiceCap);
      if (midway) clearTimeout(midway);
    };
  }, [playingIndex, selectedMoves]);

  useEffect(() => {
    return () => stopVoice();
  }, []);

  const toggleMove = (key) => {
    setSelectedMoves((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const pickGoodMix = () => {
    const remaining = STRETCH_MOVES.filter((m) => !selectedMoves.includes(m.key));
    const drawn = [...remaining].sort(() => Math.random() - 0.5).slice(0, 3).map((m) => m.key);
    setSelectedMoves((prev) => [...prev, ...drawn]);
    setJustDrawn(drawn);
    setTimeout(() => setJustDrawn([]), 1400);
  };

  const totalHoldSeconds = selectedMoves.reduce(
    (sum, key) => sum + (STRETCH_MOVES.find((m) => m.key === key)?.hold || 0),
    0
  );

  const finished = playingIndex >= 0 && playingIndex >= selectedMoves.length;

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalCard, maxWidth: 380 }}>
        {playingIndex < 0 && (
          <>
            <div className="lineup-display" style={{ fontSize: 22, color: "var(--chalk)", textAlign: "center", marginBottom: 4 }}>
              Pick Your Moves
            </div>
            <div style={{ color: "var(--chalk-dim)", fontSize: 14, textAlign: "center", marginBottom: 16 }}>
              Pick 3 or 4 for a solid warm-up — more if you have time.
            </div>
            {selectedMoves.length > 0 && (
              <div style={{ color: "var(--sky)", fontSize: 13, textAlign: "center", marginBottom: 12 }}>
                {selectedMoves.length} selected · about {Math.max(1, Math.round(totalHoldSeconds / 60))} min
              </div>
            )}
            <button onClick={pickGoodMix} disabled={selectedMoves.length >= STRETCH_MOVES.length} style={{ ...styles.chip, width: "100%", marginBottom: 12, textAlign: "center", color: "var(--amber)", borderColor: "rgba(242,169,59,0.4)", opacity: selectedMoves.length >= STRETCH_MOVES.length ? 0.4 : 1 }}>
              🎴 Draw 3 Moves
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, maxHeight: 300, overflowY: "auto" }}>
              {STRETCH_MOVES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => toggleMove(m.key)}
                  style={{
                    ...styles.taskRow,
                    borderColor: selectedMoves.includes(m.key) ? "var(--turf-bright)" : "var(--line)",
                    animation: justDrawn.includes(m.key) ? `cardPop 0.5s ease-out ${justDrawn.indexOf(m.key) * 0.15}s backwards` : "none",
                  }}
                >
                  <span
                    style={{
                      width: 18, height: 18, borderRadius: 5,
                      border: `2px solid ${selectedMoves.includes(m.key) ? "var(--turf-bright)" : "var(--chalk-dim)"}`,
                      background: selectedMoves.includes(m.key) ? "var(--turf-bright)" : "transparent",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#10151A", flexShrink: 0,
                    }}
                  >
                    {selectedMoves.includes(m.key) ? "✓" : ""}
                  </span>
                  <span style={{ flex: 1 }}>
                    <div style={{ color: "var(--chalk)", fontSize: 16, fontWeight: 600 }}>{m.label}</div>
                    <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginTop: 2 }}>{m.cue}</div>
                    <div style={{ color: "var(--sky)", fontSize: 13, marginTop: 1 }}>{m.benefit}</div>
                  </span>
                </button>
              ))}
            </div>
            <button
              style={{ ...styles.primaryBtn, width: "100%", opacity: selectedMoves.length >= MIN_STRETCH_MOVES ? 1 : 0.4 }}
              disabled={selectedMoves.length < MIN_STRETCH_MOVES}
              onClick={() => {
                // iOS only allows speech that begins inside a tap. Unlocking
                // here lets the moves, which start from a timer, speak at all.
                if (voiceOn) unlockVoice();
                setPlayingIndex(0);
              }}
            >
              {selectedMoves.length < MIN_STRETCH_MOVES ? `Pick ${MIN_STRETCH_MOVES - selectedMoves.length} more` : "Start"}
            </button>
            <button style={{ ...styles.skipBtn, marginTop: 6 }} onClick={onClose}>
              Cancel
            </button>
          </>
        )}

        {playingIndex >= 0 && !finished && (
          <>
            {(() => {
              const current = STRETCH_MOVES.find((m) => m.key === selectedMoves[playingIndex]);
              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ color: "var(--chalk-dim)", fontSize: 14 }}>
                      Move {playingIndex + 1} of {selectedMoves.length}
                    </div>
                    <button
                      onClick={() => setVoiceOn((v) => !v)}
                      style={{ background: "transparent", border: "none", color: "var(--chalk-dim)", fontSize: 20, cursor: "pointer" }}
                      aria-label="Toggle voice guidance"
                    >
                      {voiceOn ? "🔊" : "🔇"}
                    </button>
                  </div>
                  <div className="lineup-display" style={{ fontSize: 24, color: "var(--chalk)", textAlign: "center", marginBottom: 12 }}>
                    {current?.label}
                  </div>
                  <div style={{ textAlign: "center", marginBottom: 8 }}>
                    <PlayerAvatar
                      number=""
                      size={150}
                      manualPose={current?.pose}
                      glasses={avatarStyle.glasses}
                      furStyle={avatarStyle.furStyle}
                      bow={avatarStyle.bow}
                      bowColor={avatarStyle.bowColor}
                      skinTone={avatarStyle.skinTone}
                      hairColor={avatarStyle.hairColor}
                      sockColor={avatarStyle.sockColor}
                      color={avatarStyle.jerseyColor || "var(--turf-bright)"}
                    />
                  </div>
                  <div className="lineup-display" style={{ textAlign: "center", fontSize: 36, color: "var(--amber)", margin: "4px 0" }}>
                    {countdown > 0 ? `${countdown}s` : "Hold…"}
                  </div>
                  <div style={styles.cueBox}>{current?.cue}</div>
                  <div style={{ color: "var(--sky)", fontSize: 14, textAlign: "center" }}>{current?.benefit}</div>
                </>
              );
            })()}
          </>
        )}

        {finished && (
          <>
            <div className="lineup-display" style={{ fontSize: 24, color: "var(--turf-bright)", textAlign: "center", marginBottom: 8 }}>
              Stretch Clear! 🎉
            </div>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <PlayerAvatar number="" size={110} glasses={avatarStyle.glasses} furStyle={avatarStyle.furStyle} bow={avatarStyle.bow} bowColor={avatarStyle.bowColor} skinTone={avatarStyle.skinTone} hairColor={avatarStyle.hairColor} sockColor={avatarStyle.sockColor} color={avatarStyle.jerseyColor || "var(--turf-bright)"} />
            </div>
            <div style={{ color: "var(--chalk-dim)", fontSize: 15, textAlign: "center", marginBottom: 16 }}>
              {selectedMoves.length} moves done — nice warm-up.
            </div>
            <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={onComplete}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const CHEER_MAX = 120;

function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function CheerTab({ me, cheers, cheerMsg, setCheerMsg, onSend }) {
  // Local on purpose: leaving the tab drops the pick, so it starts fresh.
  const [icon, setIcon] = useState(null);
  const [focused, setFocused] = useState(false);
  const today = todayKey();
  const sentToday = cheers.filter((c) => c.from === me && dateKey(new Date(c.ts)) === today).length;
  const left = Math.max(CHEER_DAILY_LIMIT - sentToday, 0);
  const canSend = (cheerMsg.trim() || icon) && left > 0;
  const iconOf = (key) => (KUDOS.find((k) => k.key === key) || {}).icon || "";
  const weekCheers = cheers.filter((c) => inThisWeek(c.ts));
  const send = async () => {
    if (await onSend(icon)) setIcon(null);
  };
  return (
    <div>
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div style={{ color: "var(--chalk)", fontSize: 16, fontWeight: 600 }}>📣 Cheer on the team</div>
          <div className="lineup-mono" style={{ color: "var(--chalk-dim)", fontSize: 13 }}>{left} left today</div>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {KUDOS.map((k) => {
            const on = icon === k.key;
            return (
              <button
                key={k.key}
                type="button"
                aria-pressed={on}
                onClick={() => setIcon(on ? null : k.key)}
                style={{ ...styles.kudosBtn, borderColor: on ? "var(--amber)" : "var(--line)", background: on ? "rgba(242,169,59,0.15)" : "var(--bg-elev2)" }}
              >
                <span style={{ fontSize: 26, lineHeight: 1 }}>{k.icon}</span>
                <span style={{ fontSize: 11, color: on ? "var(--amber)" : "var(--chalk-dim)", marginTop: 4 }}>{k.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {QUICK_CHEERS.map((q) => (
            <button key={q} onClick={() => setCheerMsg(q)} style={{ ...styles.quickChip, borderColor: cheerMsg === q ? "var(--sky)" : "var(--line)", color: cheerMsg === q ? "var(--sky)" : "var(--chalk-dim)" }}>
              {q}
            </button>
          ))}
        </div>
        <div style={{ ...styles.composer, borderColor: focused ? "var(--amber)" : "var(--line)", boxShadow: focused ? "0 0 0 3px rgba(242,169,59,0.15)" : "none" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            {icon && (
              <button type="button" onClick={() => setIcon(null)} aria-label="Remove icon" style={styles.composerIcon}>
                {iconOf(icon)}
                <span style={styles.composerIconX}>×</span>
              </button>
            )}
            <textarea
              value={cheerMsg}
              onChange={(e) => setCheerMsg(e.target.value.slice(0, CHEER_MAX))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Write your own cheer…"
              rows={2}
              style={styles.composerText}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span className="lineup-mono" style={{ fontSize: 12, color: cheerMsg.length > CHEER_MAX - 15 ? "var(--amber)" : "var(--chalk-dim)" }}>
              {cheerMsg.length}/{CHEER_MAX}
            </span>
            <button onClick={send} disabled={!canSend} style={{ ...styles.primaryBtn, minHeight: 44, padding: "10px 18px", fontSize: 16, borderRadius: 22, opacity: canSend ? 1 : 0.4 }}>
              {icon ? iconOf(icon) : "📣"} Send to the team
            </button>
          </div>
        </div>
        {left === 0 && <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginTop: 8, textAlign: "center" }}>That's today's 3 — more tomorrow!</div>}
      </div>
      <div style={{ color: "var(--chalk-dim)", fontSize: 13, lineHeight: 1.5, margin: "10px 4px 0" }}>
        👑 Every <b style={{ color: "var(--chalk)" }}>5 cheers</b> this week earns you a bigger crown — see your tier in the Ranking tab. Crowns start over every Monday.
      </div>

      <div style={{ color: "var(--chalk-dim)", fontSize: 13, margin: "20px 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>This Week's Cheers</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {weekCheers.length === 0 && <div style={{ color: "var(--chalk-dim)", fontSize: 15 }}>No cheers yet this week. Send the first one!</div>}
        {weekCheers.slice(0, 20).map((c, i) => {
          const mine = c.from === me;
          return (
            <div key={i} style={{ ...styles.cheerRow, display: "flex", gap: 12, alignItems: "flex-start", borderColor: mine ? "rgba(242,169,59,0.35)" : "var(--line)" }}>
              <div style={styles.cheerBadge}>{c.icon ? iconOf(c.icon) : "📣"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* No sender number: send a cheer next to a friend and "#68" pops up
                    right then, which hands them your number — and with it your
                    ranking and wall posts. Crowns still count by number underneath. */}
                <div style={{ fontSize: 13, color: "var(--chalk-dim)" }}>
                  <span style={{ color: mine ? "var(--amber)" : "var(--sky)", fontWeight: 600 }}>{mine ? "You" : "A teammate"}</span>
                  {" → "}
                  {c.to === "team" ? "Team" : `#${c.to}`}
                  {c.ts ? ` · ${timeAgo(c.ts)}` : ""}
                </div>
                {c.message && <div style={{ color: "var(--chalk)", fontSize: 16, marginTop: 3, lineHeight: 1.4, overflowWrap: "anywhere" }}>{c.message}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Challenge Tab ─────────────────────────── */

function GoalBar({ emoji, title, subtitle, current, target }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  const complete = current >= target;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ color: "var(--chalk)", fontSize: 16, fontWeight: 600 }}>{emoji} {title} {complete && "✓"}</span>
        <span className="lineup-mono" style={{ color: "var(--chalk-dim)", fontSize: 14 }}>{Math.min(current, target)}/{target}</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${pct}%`, background: complete ? "var(--turf-bright)" : "var(--sky)" }} />
      </div>
      <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginTop: 4 }}>{subtitle}</div>
    </div>
  );
}

function ChallengeTab({ players, cheers, aggregateCheckins, unlocked, teamPct, me, soccerProgress, onPassLevel }) {
  const progress = unlocked ? computeChallengeProgress(players, cheers, aggregateCheckins) : null;
  return (
    <div>
      {!unlocked ? (
        <div style={styles.card}>
          <div className="lineup-display" style={{ fontSize: 22, color: "var(--chalk-dim)" }}>🔒 Weekly Mission Locked</div>
          <div style={{ color: "var(--chalk-dim)", fontSize: 15, marginTop: 8 }}>
            This week's co-op goals unlock as the team's check-in rate rises. (Individual check-ins stay private.) The bonus games below are always open, though!
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${teamPct}%` }} />
          </div>
          <div className="lineup-mono" style={{ fontSize: 14, color: "var(--chalk-dim)", marginTop: 6 }}>Team check-in rate: {teamPct}%</div>
        </div>
      ) : (
        <div style={styles.card}>
          <div className="lineup-display" style={{ fontSize: 22, color: "var(--turf-bright)" }}>This Week's Co-op Mission</div>
          <div style={{ color: "var(--chalk-dim)", fontSize: 15, marginTop: 6, marginBottom: 18 }}>
            These track automatically from what the team is already doing — nothing to check off by hand. A new mission starts every Monday.
          </div>
          <GoalBar emoji="📣" title="Team Cheer Power" subtitle="Total cheers sent by anyone on the team this week." current={progress.weeklyCheers} target={progress.cheerTarget} />
          <GoalBar emoji="✅" title="Full House Check-Ins" subtitle="Combined check-ins across the whole team this week (still anonymous)." current={progress.weeklyCheckins} target={progress.checkinTarget} />
          <GoalBar emoji="👑" title="Crown Club" subtitle="Number of teammates who've earned at least a Bronze Crown." current={progress.crownClub} target={progress.crownTarget} />
          {progress.allComplete && (
            <div style={styles.coachCard}>
              <div style={{ fontSize: 15, color: "var(--amber)", fontWeight: 700, marginBottom: 4 }}>🛡️ Coach {COACH_NAME.replace("Mr. ", "")} says:</div>
              <div style={{ color: "var(--chalk)", fontSize: 16, fontStyle: "italic" }}>"{getCoachQuote()}"</div>
            </div>
          )}
        </div>
      )}
      <CalmCorner />
      <SoccerSeries me={me} soccerProgress={soccerProgress} onPassLevel={onPassLevel} />
    </div>
  );
}

/* ── Knight's Quest: four skill games ───────── */

// Real games now — touch, timing, focus, reaction — instead of a quiz and
// two coin-flip shootouts. Ids and rewards are unchanged, so progress
// already saved in soccerProgress still lines up.
const SOCCER_LEVELS = [
  { id: 1, title: "Squire's Touch", icon: "⚽", type: "juggle", rounds: 3, passCount: 1, reward: 5, roundLabel: "Try", desc: "Keep the ball up for 8 touches. Three tries." },
  { id: 2, title: "Storm the Goal", icon: "🎯", type: "penalty", rounds: 5, passCount: 3, reward: 5, roundLabel: "Kick", desc: "Lock your aim, time your power — score 3 of 5." },
  { id: 3, title: "Knight's Eye", icon: "👁️", type: "track", rounds: 3, passCount: 2, reward: 8, roundLabel: "Round", desc: "Focus: follow the gold balls through the shuffle." },
  { id: 4, title: "The Golden Knight", icon: "🏆", type: "keeper", rounds: 6, passCount: 4, reward: 15, roundLabel: "Shot", desc: "You're in goal — save 4 of 6 to guard the castle." },
];

// The school crest: a knight on a rearing horse, in Marianapolis maroon and gold.
function KnightRider({ size = 64 }) {
  const HORSE = "#241C1A";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ display: "block" }}>
      <path d="M26 58 C16 60 12 70 14 80" stroke={HORSE} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M32 70 L30 88" stroke={HORSE} strokeWidth="7" strokeLinecap="round" />
      <path d="M40 72 L42 88" stroke={HORSE} strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="42" cy="62" rx="19" ry="13" fill={HORSE} transform="rotate(-14 42 62)" />
      <path d="M52 54 L66 40 L75 35 L77 42 L68 48 L60 58 Z" fill={HORSE} />
      <path d="M56 58 C64 54 70 50 72 44" stroke={HORSE} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M52 65 C60 63 66 60 70 56" stroke={HORSE} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M38 50 L46 38 L54 44 L48 56 Z" fill={SCHOOL_GOLD} />
      <circle cx="46" cy="33" r="7" fill={SCHOOL_GOLD} />
      <rect x="41" y="31" width="10" height="3" fill={HORSE} />
      <path d="M46 26 C44 20 48 16 52 15" stroke={SCHOOL_MAROON} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M40 40 L86 19" stroke={SCHOOL_GOLD} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M26 44 L40 44 L40 56 C40 62 33 66 33 66 C33 66 26 62 26 56 Z" fill={SCHOOL_MAROON} stroke={SCHOOL_GOLD} strokeWidth="2" />
      <path d="M33 47 L33 61 M28.5 52 L37.5 52" stroke={SCHOOL_GOLD} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// Progress strip: the knight rides toward the castle as levels fall.
function QuestTrail({ level, total }) {
  const pct = Math.min(Math.max(level / total, 0), 1);
  return (
    <div style={styles.questTrail}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 16, height: 2, background: "rgba(241,239,231,0.18)" }} />
      <div style={{ position: "absolute", right: 12, bottom: 18, fontSize: 38 }}>🏰</div>
      <div style={{ position: "absolute", bottom: 12, left: `calc(10px + ${pct} * (100% - 96px))`, transition: "left 0.7s cubic-bezier(.34,1.3,.64,1)" }}>
        <KnightRider size={56} />
      </div>
    </div>
  );
}

// Runs cb(dt, now) every animation frame while `active`; dt in seconds, capped
// so a backgrounded tab doesn't come back and teleport everything.
function useFrame(cb, active) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!active) return;
    let id;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      cbRef.current(dt, now);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

const playTouchSound = () => playTone(660, 0, 0.08, "triangle", 0.1);

// Level 1 — keep the ball in the air. Tap the ball itself; hitting it
// off-center sends it sideways, so it takes real control, not just speed.
function JuggleRound({ onResult, target = 8 }) {
  const H = 300;
  const R = 26;
  const areaRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const ball = useRef({ x: 160, y: 150, vx: 0, vy: 0 });
  const [, setFrame] = useState(0);
  const [phase, setPhase] = useState("ready"); // ready -> play -> done
  const [touches, setTouches] = useState(0);
  const [won, setWon] = useState(false);

  useEffect(() => {
    const w = areaRef.current?.clientWidth || 320;
    ball.current = { x: w / 2, y: 150, vx: 0, vy: 0 };
    setFrame((f) => f + 1);
  }, []);

  const end = (success) => {
    setPhase("done");
    setWon(success);
    if (success) playGoalSound();
    else playSavedSound();
    onResultRef.current(success);
  };

  useFrame((dt) => {
    const b = ball.current;
    const w = areaRef.current?.clientWidth || 320;
    b.vy += (1500 + touches * 30) * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) * 0.8; }
    if (b.x > w - R) { b.x = w - R; b.vx = -Math.abs(b.vx) * 0.8; }
    if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy) * 0.3; }
    setFrame((f) => f + 1);
    if (b.y > H - R - 6) {
      b.y = H - R - 6;
      end(false);
    }
  }, phase === "play");

  const tap = (e) => {
    if (phase === "done") return;
    const rect = areaRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const b = ball.current;
    if (Math.hypot(px - b.x, py - b.y) > R * 2.1) return;
    if (phase === "play" && b.vy < -250) return; // already on its way up
    b.vy = -680;
    b.vx = Math.max(-260, Math.min(260, b.vx * 0.4 + (b.x - px) * 7));
    playTouchSound();
    const n = touches + 1;
    setTouches(n);
    if (phase === "ready") setPhase("play");
    if (n >= target) end(true);
  };

  const b = ball.current;
  return (
    <div ref={areaRef} onPointerDown={tap} style={{ ...styles.arena, height: H }}>
      <div className="lineup-display" style={styles.arenaBigCount}>
        {touches}/{target}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: "rgba(95,168,90,0.5)" }} />
      <div style={{ position: "absolute", left: b.x - R, top: b.y - R, width: R * 2, height: R * 2, fontSize: R * 1.8, lineHeight: `${R * 2}px`, textAlign: "center", transform: `rotate(${b.x * 3}deg)`, pointerEvents: "none" }}>
        ⚽
      </div>
      <div style={styles.arenaHint}>
        {phase === "ready" && "Tap the ball to start — keep it off the ground!"}
        {phase === "done" && (won ? `${target} touches — nice control!` : `Dropped after ${touches}. Next try!`)}
      </div>
    </div>
  );
}

// Level 2 — two taps: lock the aim while the marker sweeps, then lock the
// power. Too close to the post goes wide, too hard goes over, too soft or too
// close to the keeper gets saved.
function PenaltyRound({ onResult, hard = false }) {
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const [phase, setPhase] = useState("aim"); // aim -> power -> shot -> done
  const [clock, setClock] = useState(0);
  const offset = useRef(Math.random() * Math.PI * 2);
  const [aimU, setAimU] = useState(null);
  const [power, setPower] = useState(null);
  const [keeperAt, setKeeperAt] = useState(null);
  const [result, setResult] = useState(null);

  const aimSpeed = hard ? 3.0 : 2.2;
  const powerSpeed = hard ? 4.4 : 3.3;
  const keeperSpeed = hard ? 1.8 : 1.3;
  const reach = hard ? 0.2 : 0.16;

  useFrame((dt) => setClock((c) => c + dt), phase === "aim" || phase === "power");

  const liveAim = 0.5 + 0.52 * Math.sin(clock * aimSpeed + offset.current);
  const livePower = (1 - Math.cos(clock * powerSpeed)) / 2;
  const liveKeeper = 0.5 + 0.3 * Math.sin(clock * keeperSpeed + offset.current * 1.7);

  const tap = () => {
    if (phase === "aim") {
      setAimU(liveAim);
      setClock(0);
      setPhase("power");
    } else if (phase === "power") {
      const p = livePower;
      const k = liveKeeper;
      let outcome;
      if (aimU < 0.03 || aimU > 0.97) outcome = "wide";
      else if (p > 0.85) outcome = "over";
      else if (Math.abs(aimU - k) < (p < 0.35 ? 0.45 : reach)) outcome = "saved";
      else outcome = "goal";
      const dive = Math.max(-reach - 0.05, Math.min(reach + 0.05, aimU - k));
      setPower(p);
      setKeeperAt(k + dive);
      setPhase("shot");
      setTimeout(() => {
        setResult(outcome);
        setPhase("done");
        if (outcome === "goal") playGoalSound();
        else playSavedSound();
        onResultRef.current(outcome === "goal");
      }, 550);
    }
  };

  const toLeft = (u) => `${8 + u * 84}%`;
  const keeperU = keeperAt ?? liveKeeper;
  const shown = aimU ?? liveAim;
  const flying = phase === "shot" || phase === "done";
  const shotTop = power == null ? "78%" : power > 0.85 ? "-8%" : "22%";
  const label = { goal: "GOAL!", saved: "SAVED!", wide: "WIDE!", over: "OVER THE BAR!" }[result];

  return (
    <div onPointerDown={tap} style={{ touchAction: "manipulation", userSelect: "none", WebkitUserSelect: "none" }}>
      <div style={{ ...styles.goalBox, cursor: "pointer" }}>
        <div style={styles.goalNet} />
        <div style={{ position: "absolute", top: 40, left: toLeft(keeperU), transform: "translateX(-50%)", transition: flying ? "left 0.45s ease-out" : "none" }}>
          <KnightRider size={56} />
        </div>
        {!flying && (
          <div style={{ position: "absolute", top: 58, left: toLeft(shown), transform: "translate(-50%, -50%)", width: 26, height: 26, borderRadius: "50%", border: "3px solid var(--amber)", boxShadow: "0 0 0 3px rgba(242,169,59,0.25)" }} />
        )}
        <div style={{ ...styles.ball, left: flying ? toLeft(aimU) : "50%", top: flying ? shotTop : "78%", transition: "left 0.5s ease-out, top 0.5s ease-out" }}>⚽</div>
        {label && <div style={{ ...styles.shotResult, color: result === "goal" ? "var(--turf-bright)" : "var(--danger)" }}>{label}</div>}
      </div>
      <div style={{ ...styles.powerTrack, visibility: phase === "aim" ? "hidden" : "visible" }}>
        <div style={styles.powerZone} />
        <div style={{ ...styles.powerMarker, left: `${(power ?? livePower) * 100}%` }} />
      </div>
      <button type="button" style={{ ...styles.primaryBtn, width: "100%", marginTop: 10, background: "var(--sky)", opacity: flying ? 0.4 : 1 }}>
        {phase === "aim" ? "Tap to lock your aim" : phase === "power" ? "Tap to shoot — stop in the green" : "…"}
      </button>
    </div>
  );
}

// Level 3 — "Knight's Eye", the focus game. The gold balls are shown, then
// every ball looks the same and they shuffle around; find the gold ones again.
// Same skill as keeping track of the ball and your teammates at once.
function TrackRound({ onResult, count = 6, marked = 2, moveMs = 5000 }) {
  const H = 300;
  const R = 22;
  const areaRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const balls = useRef([]);
  const [, setFrame] = useState(0);
  const [phase, setPhase] = useState("show"); // show -> move -> pick -> done
  const [picks, setPicks] = useState([]);

  useEffect(() => {
    const w = areaRef.current?.clientWidth || 320;
    const cols = 3;
    const cellW = w / cols;
    const cellH = H / Math.ceil(count / cols);
    const golds = Array.from({ length: count }, (_, i) => i < marked).sort(() => Math.random() - 0.5);
    balls.current = golds.map((gold, i) => {
      const angle = Math.random() * Math.PI * 2;
      return {
        x: cellW * (i % cols) + cellW / 2,
        y: cellH * Math.floor(i / cols) + cellH / 2,
        vx: Math.cos(angle),
        vy: Math.sin(angle),
        gold,
      };
    });
    setFrame((f) => f + 1);
    const t1 = setTimeout(() => setPhase("move"), 1800);
    const t2 = setTimeout(() => setPhase("pick"), 1800 + moveMs);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useFrame((dt) => {
    const w = areaRef.current?.clientWidth || 320;
    const speed = 110;
    for (const b of balls.current) {
      // a little wander so the paths aren't straight lines
      const turn = (Math.random() - 0.5) * 3 * dt;
      const c = Math.cos(turn);
      const s = Math.sin(turn);
      [b.vx, b.vy] = [b.vx * c - b.vy * s, b.vx * s + b.vy * c];
      b.x += b.vx * speed * dt;
      b.y += b.vy * speed * dt;
      if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); }
      if (b.x > w - R) { b.x = w - R; b.vx = -Math.abs(b.vx); }
      if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy); }
      if (b.y > H - R) { b.y = H - R; b.vy = -Math.abs(b.vy); }
    }
    setFrame((f) => f + 1);
  }, phase === "move");

  const pick = (i) => {
    if (phase !== "pick" || picks.includes(i)) return;
    const next = [...picks, i];
    setPicks(next);
    playTouchSound();
    if (next.length === marked) {
      const success = next.every((j) => balls.current[j].gold);
      setPhase("done");
      if (success) playCorrectSound();
      else playWrongSound();
      onResultRef.current(success);
    }
  };

  const what = marked === 1 ? "gold ball" : `${marked} gold balls`;
  return (
    <div ref={areaRef} style={{ ...styles.arena, height: H }}>
      {balls.current.map((b, i) => {
        let ring = "transparent";
        if (phase === "show" && b.gold) ring = "var(--amber)";
        if (phase === "pick" && picks.includes(i)) ring = "var(--sky)";
        if (phase === "done") ring = b.gold ? "var(--turf-bright)" : picks.includes(i) ? "var(--danger)" : "transparent";
        return (
          <button
            key={i}
            type="button"
            onPointerDown={() => pick(i)}
            style={{ position: "absolute", left: b.x - R, top: b.y - R, width: R * 2, height: R * 2, borderRadius: "50%", border: `3px solid ${ring}`, background: phase === "show" && b.gold ? "rgba(242,169,59,0.35)" : "transparent", fontSize: R * 1.4, lineHeight: 1, padding: 0, cursor: phase === "pick" ? "pointer" : "default", touchAction: "manipulation" }}
          >
            ⚽
          </button>
        );
      })}
      <div style={styles.arenaHint}>
        {phase === "show" && `Watch the ${what}…`}
        {phase === "move" && "Keep your eyes on them…"}
        {phase === "pick" && `Tap the ${what} (${picks.length}/${marked})`}
      </div>
    </div>
  );
}

// Level 4 — you're the keeper. Drag (or tap) to move; the glove glides toward
// your finger at a fixed top speed, so you have to read the shot early.
function KeeperRound({ onResult, travelMs = 850 }) {
  const H = 300;
  const GLOVE = 34; // half width
  const LINE = H - 42;
  const areaRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const keeper = useRef({ x: 160, target: 160 });
  const shot = useRef(null);
  const [, setFrame] = useState(0);
  const [phase, setPhase] = useState("windup"); // windup -> flight -> done
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    const w = areaRef.current?.clientWidth || 320;
    keeper.current = { x: w / 2, target: w / 2 };
    shot.current = {
      fromX: w * (0.25 + Math.random() * 0.5),
      toX: w * (0.12 + Math.random() * 0.76),
      curve: (Math.random() - 0.5) * 120,
      t: 0,
    };
    setFrame((f) => f + 1);
    const t = setTimeout(() => setPhase("flight"), 700 + Math.random() * 600);
    return () => clearTimeout(t);
  }, []);

  useFrame((dt) => {
    const k = keeper.current;
    const step = 720 * dt;
    k.x += Math.max(-step, Math.min(step, k.target - k.x));
    if (phase === "flight") {
      const s = shot.current;
      s.t += (dt * 1000) / travelMs;
      if (s.t >= 1) {
        s.t = 1;
        const ok = Math.abs(s.toX - k.x) < GLOVE + 16;
        setSaved(ok);
        setPhase("done");
        if (ok) playCorrectSound();
        else playSavedSound();
        onResultRef.current(ok);
      }
    }
    setFrame((f) => f + 1);
  }, phase !== "done");

  const steer = (e) => {
    if (phase === "done") return;
    if (e.type === "pointermove" && e.pointerType === "mouse" && e.buttons === 0) return;
    const rect = areaRef.current.getBoundingClientRect();
    keeper.current.target = Math.max(GLOVE, Math.min(rect.width - GLOVE, e.clientX - rect.left));
  };

  const s = shot.current;
  const p = s ? s.t : 0;
  const bx = s ? s.fromX + (s.toX - s.fromX) * p + s.curve * Math.sin(Math.PI * p) : 0;
  const by = 26 + (LINE - 26) * p;
  const size = 20 + 22 * p;

  return (
    <div ref={areaRef} onPointerDown={steer} onPointerMove={steer} style={{ ...styles.arena, height: H }}>
      <div style={{ position: "absolute", left: "6%", right: "6%", bottom: 0, height: 34, border: "4px solid var(--chalk-dim)", borderBottom: "none", backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(241,239,231,0.15) 11px)" }} />
      {s && phase === "windup" && <div style={{ position: "absolute", left: s.fromX, top: 8, transform: "translateX(-50%)", fontSize: 13, color: "var(--amber)" }}>▼</div>}
      {s && <div style={{ position: "absolute", left: bx, top: by, transform: "translate(-50%, -50%)", fontSize: size, lineHeight: 1, pointerEvents: "none" }}>⚽</div>}
      <div style={{ position: "absolute", left: keeper.current.x - GLOVE, top: LINE - 10, width: GLOVE * 2, height: 22, borderRadius: 11, background: SCHOOL_MAROON, border: `3px solid ${SCHOOL_GOLD}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, pointerEvents: "none" }}>
        <span>🧤</span>
        <span>🧤</span>
      </div>
      <div style={{ ...styles.arenaHint, top: 40, bottom: "auto" }}>
        {phase === "windup" && "Drag to move — here it comes…"}
        {phase === "done" && (saved ? "SAVED! 🧤" : "Goal… reset and go again.")}
      </div>
    </div>
  );
}

// Calm Down — breathing, deliberately outside the quest: no score, no pass or
// fail, nothing saved. Something graded is the opposite of what a nervous
// player needs before kickoff.
const BREATH_MODES = {
  box: { icon: "⬜", title: "Box Breathing", desc: "In 4 · hold 4 · out 4 · hold 4", cycle: 16 },
  balloon: { icon: "🎈", title: "Balloon Breath", desc: "In for 4, slowly out for 6", cycle: 10 },
};

function CalmCorner() {
  const [mode, setMode] = useState(null);
  const [t, setT] = useState(0);
  useFrame((dt) => setT((x) => x + dt), mode !== null);

  if (!mode) {
    return (
      <div style={{ ...styles.card, marginTop: 14 }}>
        <div style={{ color: "var(--chalk)", fontSize: 19, fontWeight: 700, marginBottom: 2 }}>🌿 Calm Down</div>
        <div style={{ color: "var(--chalk-dim)", fontSize: 14, marginBottom: 14 }}>
          Nervous before a game? A minute of slow breathing settles your body. No score, nothing to win — just breathe.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(BREATH_MODES).map(([key, m]) => (
            <button key={key} onClick={() => { setT(0); setMode(key); }} style={styles.taskRow}>
              <span style={{ fontSize: 22 }}>{m.icon}</span>
              <span style={{ flex: 1 }}>
                <div style={{ color: "var(--chalk)", fontSize: 16, fontWeight: 600 }}>{m.title}</div>
                <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginTop: 1 }}>{m.desc}</div>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const m = BREATH_MODES[mode];
  const c = t % m.cycle;
  let cue;
  let count;
  let visual;
  if (mode === "box") {
    const side = Math.floor(c / 4);
    const f = (c % 4) / 4;
    const S = 180;
    cue = ["Breathe in", "Hold", "Breathe out", "Hold"][side];
    count = Math.floor(c % 4) + 1;
    // up the left edge, across the top, down the right, back along the bottom
    const [x, y] = [[0, S - f * S], [f * S, 0], [S, f * S], [S - f * S, S]][side];
    visual = (
      <div style={{ position: "relative", width: S, height: S, margin: "20px auto", border: "3px solid rgba(127,168,201,0.45)", borderRadius: 8 }}>
        <div style={{ position: "absolute", left: x - 11, top: y - 11, width: 22, height: 22, borderRadius: "50%", background: "var(--sky)", boxShadow: "0 0 16px var(--sky)" }} />
      </div>
    );
  } else {
    const inhale = c < 4;
    const f = inhale ? c / 4 : (c - 4) / 6;
    const ease = (1 - Math.cos(Math.PI * f)) / 2;
    const scale = inhale ? 0.5 + 0.5 * ease : 1 - 0.5 * ease;
    cue = inhale ? "Breathe in" : "Breathe out… slowly";
    count = inhale ? Math.floor(c) + 1 : Math.floor(c - 4) + 1;
    visual = (
      <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(127,168,201,0.55), rgba(127,168,201,0.15))", transform: `scale(${scale})` }} />
      </div>
    );
  }

  return (
    <div style={{ ...styles.card, marginTop: 14, textAlign: "center" }}>
      <div style={{ color: "var(--chalk-dim)", fontSize: 14 }}>{m.title}</div>
      {visual}
      <div className="lineup-display" style={{ fontSize: 28, color: "var(--chalk)" }}>{cue}</div>
      <div className="lineup-mono" style={{ fontSize: 22, color: "var(--sky)", marginTop: 4 }}>{count}</div>
      <div style={{ color: "var(--chalk-dim)", fontSize: 14, minHeight: 20, marginTop: 10 }}>
        {t >= 60 ? "That's a minute. Take this calm onto the field. 🌿" : ""}
      </div>
      <button style={{ ...styles.skipBtn, marginTop: 8 }} onClick={() => setMode(null)}>
        Done
      </button>
    </div>
  );
}

function LevelPlayer({ level, onExit, onFinish }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState(false);

  const handleRoundResult = (success) => {
    const newSuccess = successCount + (success ? 1 : 0);
    const newIndex = roundIndex + 1;
    setSuccessCount(newSuccess);
    // End early once passing is certain or out of reach — no one wants to
    // play out two more juggling tries after already hitting 8.
    const decided = newSuccess >= level.passCount || newSuccess + (level.rounds - newIndex) < level.passCount;
    if (newIndex >= level.rounds || decided) {
      const didPass = newSuccess >= level.passCount;
      setTimeout(() => {
        setPassed(didPass);
        setFinished(true);
        if (didPass) {
          playLevelClearSound();
          onFinish(true);
        }
      }, 1300);
    } else {
      setTimeout(() => setRoundIndex(newIndex), 1300);
    }
  };

  const retry = () => {
    setRoundIndex(0);
    setSuccessCount(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div>
        <div className="lineup-display" style={{ fontSize: 24, textAlign: "center", color: passed ? "var(--turf-bright)" : "var(--danger)", marginBottom: 8 }}>
          {passed ? "Level Clear! \ud83c\udf89" : "Try Again"}
        </div>
        <div style={{ color: "var(--chalk-dim)", textAlign: "center", marginBottom: passed ? 6 : 16 }}>
          {successCount} of {level.rounds} — needed {level.passCount}
        </div>
        {passed && <div style={{ color: "var(--amber)", textAlign: "center", marginBottom: 16, fontWeight: 700 }}>+{level.reward}pt earned</div>}
        <div style={{ display: "flex", gap: 8 }}>
          {!passed && (
            <button style={{ ...styles.primaryBtn, flex: 1 }} onClick={retry}>
              Retry
            </button>
          )}
          <button style={{ ...styles.skipBtn, flex: 1 }} onClick={onExit}>
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ color: "var(--chalk-dim)", fontSize: 14 }}>
          {level.icon} {level.title}
        </span>
        <span className="lineup-mono" style={{ color: "var(--chalk-dim)", fontSize: 14 }}>
          {level.roundLabel || "Round"} {roundIndex + 1}/{level.rounds} · {successCount} ✓
        </span>
      </div>
      {level.type === "juggle" && <JuggleRound key={roundIndex} onResult={handleRoundResult} />}
      {level.type === "penalty" && <PenaltyRound key={roundIndex} onResult={handleRoundResult} />}
      {level.type === "track" && <TrackRound key={roundIndex} onResult={handleRoundResult} />}
      {level.type === "keeper" && <KeeperRound key={roundIndex} onResult={handleRoundResult} />}
      <button style={{ ...styles.skipBtn, marginTop: 14 }} onClick={onExit}>
        Quit to Map
      </button>
    </div>
  );
}

function SoccerSeries({ me, soccerProgress, onPassLevel }) {
  const myLevel = (soccerProgress && soccerProgress[me]) || 0;
  const [activeLevel, setActiveLevel] = useState(null);

  if (activeLevel) {
    return (
      <div style={{ ...styles.card, marginTop: 14 }}>
        <LevelPlayer
          level={activeLevel}
          onExit={() => setActiveLevel(null)}
          onFinish={(didPass) => {
            if (didPass) onPassLevel(activeLevel.id, activeLevel.reward);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ ...styles.card, marginTop: 14 }}>
      <div style={{ color: "var(--chalk)", fontSize: 19, fontWeight: 700, marginBottom: 2 }}>🛡️ Knight&apos;s Quest</div>
      <div style={{ color: "var(--chalk-dim)", fontSize: 14, marginBottom: 14 }}>
        Clear each level to ride further. Reach the castle to be named Golden Knight. The quest starts over every Monday.
      </div>
      <QuestTrail level={myLevel} total={SOCCER_LEVELS.length} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SOCCER_LEVELS.map((lvl) => {
          const completed = myLevel >= lvl.id;
          const unlocked = myLevel >= lvl.id - 1;
          return (
            <button
              key={lvl.id}
              onClick={() => unlocked && setActiveLevel(lvl)}
              disabled={!unlocked}
              style={{
                ...styles.taskRow,
                borderColor: completed ? "var(--turf-bright)" : unlocked ? "var(--sky)" : "var(--line)",
                opacity: unlocked ? 1 : 0.45,
                cursor: unlocked ? "pointer" : "not-allowed",
              }}
            >
              <span style={{ fontSize: 22 }}>{unlocked ? lvl.icon : "\ud83d\udd12"}</span>
              <span style={{ flex: 1 }}>
                <div style={{ color: "var(--chalk)", fontSize: 16, fontWeight: 600 }}>
                  Level {lvl.id}: {lvl.title}
                </div>
                <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginTop: 1 }}>{lvl.desc}</div>
              </span>
              {completed && <span style={{ color: "var(--turf-bright)", fontSize: 20 }}>✓</span>}
            </button>
          );
        })}
      </div>
      {myLevel >= SOCCER_LEVELS.length && (
        <div style={styles.coachCard}>
          <div style={{ fontSize: 17, color: "var(--amber)", fontWeight: 700 }}>🏆 Golden Knight!</div>
          <div style={{ color: "var(--chalk)", fontSize: 15, marginTop: 4 }}>You reached the castle. Every level of the Knight&apos;s Quest is cleared.</div>
        </div>
      )}
    </div>
  );
}


/* ── Team Tab: schedule + anonymous coach inbox ── */

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function formatGameDate(dateStr) {
  try {
    const d = new Date(dateStr + "T12:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  } catch (e) {
    return dateStr;
  }
}

function AddGameForm({ onAdd, onCancel }) {
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [homeAway, setHomeAway] = useState("home");
  const [custom, setCustom] = useState(false);

  const submit = () => {
    if (!opponent.trim() || !date) return;
    onAdd({ opponent: opponent.trim(), date, time, location: location.trim(), homeAway });
  };

  return (
    <div style={{ ...styles.card, marginBottom: 14 }}>
      <div style={{ color: "var(--chalk-dim)", fontSize: 14, marginBottom: 10 }}>Add a game</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {OPPONENTS.map((o) => {
          const on = !custom && opponent === o;
          return (
            <button
              key={o}
              onClick={() => { setOpponent(o); setCustom(false); }}
              style={{ ...styles.chip, borderColor: on ? "var(--turf-bright)" : "var(--line)", color: on ? "var(--turf-bright)" : "var(--chalk-dim)" }}
            >
              {o}
            </button>
          );
        })}
        <button
          onClick={() => { setCustom(true); setOpponent(""); }}
          style={{ ...styles.chip, borderColor: custom ? "var(--sky)" : "var(--line)", color: custom ? "var(--sky)" : "var(--chalk-dim)" }}
        >
          Other
        </button>
      </div>
      {custom && (
        <input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Opponent name" style={{ ...styles.input, marginBottom: 8 }} />
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...styles.input, flex: 1 }} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...styles.input, flex: 1 }} />
      </div>
      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" style={{ ...styles.input, marginBottom: 8 }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setHomeAway("home")} style={{ ...styles.chip, flex: 1, borderColor: homeAway === "home" ? "var(--turf-bright)" : "var(--line)", color: homeAway === "home" ? "var(--turf-bright)" : "var(--chalk-dim)" }}>
          Home
        </button>
        <button onClick={() => setHomeAway("away")} style={{ ...styles.chip, flex: 1, borderColor: homeAway === "away" ? "var(--sky)" : "var(--line)", color: homeAway === "away" ? "var(--sky)" : "var(--chalk-dim)" }}>
          Away
        </button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ ...styles.primaryBtn, flex: 1 }} onClick={submit}>Add</button>
        <button style={{ ...styles.skipBtn, flex: 1 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function ResultForm({ game, onSave, onCancel }) {
  const [outcome, setOutcome] = useState("W");
  const [score, setScore] = useState("");
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {["W", "L", "T"].map((o) => (
          <button key={o} onClick={() => setOutcome(o)} style={{ ...styles.chip, flex: 1, borderColor: outcome === o ? "var(--turf-bright)" : "var(--line)", color: outcome === o ? "var(--turf-bright)" : "var(--chalk-dim)" }}>
            {o}
          </button>
        ))}
      </div>
      <input value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score (e.g. 2-1)" style={{ ...styles.input, marginBottom: 8 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ ...styles.primaryBtn, flex: 1 }} onClick={() => onSave({ outcome, score: score.trim() })}>Save</button>
        <button style={{ ...styles.skipBtn, flex: 1 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function GameRow({ game, onAddResult }) {
  const [addingResult, setAddingResult] = useState(false);
  const isPast = game.date < todayKey();
  return (
    <div style={styles.gameRow}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ color: "var(--chalk)", fontSize: 16, fontWeight: 600 }}>vs. {game.opponent}</span>
        <span style={{ ...styles.homeAwayTag, background: game.homeAway === "home" ? "rgba(95,168,90,0.2)" : "rgba(127,168,201,0.2)", color: game.homeAway === "home" ? "var(--turf-bright)" : "var(--sky)" }}>
          {game.homeAway === "home" ? "HOME" : "AWAY"}
        </span>
      </div>
      <div className="lineup-mono" style={{ color: "var(--chalk-dim)", fontSize: 14, marginTop: 3 }}>
        {formatGameDate(game.date)}{game.time ? ` · ${formatTime(game.time)}` : ""}{game.location ? ` · ${game.location}` : ""}
      </div>
      {game.result ? (
        <div style={{ marginTop: 6, color: game.result.outcome === "W" ? "var(--turf-bright)" : game.result.outcome === "L" ? "var(--danger)" : "var(--chalk-dim)", fontWeight: 700, fontSize: 15 }}>
          {game.result.outcome} {game.result.score}
        </div>
      ) : isPast ? (
        addingResult ? (
          <ResultForm game={game} onSave={(r) => { onAddResult(game.id, r); setAddingResult(false); }} onCancel={() => setAddingResult(false)} />
        ) : (
          <button onClick={() => setAddingResult(true)} style={{ ...styles.skipBtn, marginTop: 6, padding: 0, textAlign: "left" }}>
            + Add result
          </button>
        )
      ) : null}
    </div>
  );
}

function TeamTab({ schedule, onAddGame, onAddResult, onSendCoachMessage, teamWall, me, onPostWall, onReplyWall, isCoach = false }) {
  const [showAddGame, setShowAddGame] = useState(false);
  const [coachMsg, setCoachMsg] = useState("");
  const [justSent, setJustSent] = useState(false);
  const [wallMsg, setWallMsg] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [showWarmupTips, setShowWarmupTips] = useState(false);
  const [showMentalTips, setShowMentalTips] = useState(false);

  const sorted = [...schedule].sort((a, b) => (a.date < b.date ? -1 : 1));
  const upcoming = sorted.filter((g) => g.date >= todayKey());
  const past = sorted.filter((g) => g.date < todayKey()).reverse();

  const send = () => {
    if (!coachMsg.trim()) return;
    onSendCoachMessage(coachMsg);
    setCoachMsg("");
    setJustSent(true);
    setTimeout(() => setJustSent(false), 2200);
  };

  const postWall = () => {
    if (!wallMsg.trim()) return;
    onPostWall(wallMsg);
    setWallMsg("");
  };

  return (
    <div>
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ color: "var(--chalk)", fontSize: 17, fontWeight: 700 }}>📅 Schedule</div>
          <button onClick={() => setShowAddGame((s) => !s)} style={{ ...styles.skipBtn, padding: 0 }}>
            {showAddGame ? "Close" : "+ Add game"}
          </button>
        </div>
        <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginBottom: 12 }}>Shared with the whole team — anyone can add a game or fill in a result.</div>

        {showAddGame && <AddGameForm onAdd={(g) => { onAddGame(g); setShowAddGame(false); }} onCancel={() => setShowAddGame(false)} />}

        {upcoming.length === 0 && past.length === 0 && (
          <div style={{ color: "var(--chalk-dim)", fontSize: 15 }}>No games on the schedule yet.</div>
        )}

        {upcoming.length > 0 && (
          <>
            <div style={{ color: "var(--chalk-dim)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Upcoming</div>
            {upcoming.map((g) => <GameRow key={g.id} game={g} onAddResult={onAddResult} />)}
          </>
        )}

        {past.length > 0 && (
          <>
            <div style={{ color: "var(--chalk-dim)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, margin: "14px 0 6px" }}>Past</div>
            {past.map((g) => <GameRow key={g.id} game={g} onAddResult={onAddResult} />)}
          </>
        )}
      </div>

      <div style={{ ...styles.card, marginTop: 14 }}>
        <div style={{ color: "var(--chalk)", fontSize: 17, fontWeight: 700, marginBottom: 4 }}>📣 Team Wall</div>
        <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginBottom: 12 }}>
          A public space for the whole team — post a shoutout, a goal for the week, anything. Everyone on the team can read it; posts show as "A teammate", not your number.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            value={wallMsg}
            onChange={(e) => setWallMsg(e.target.value)}
            placeholder="Say something to the team\u2026"
            style={{ ...styles.input, flex: 1 }}
          />
          <button style={styles.primaryBtn} onClick={postWall} disabled={!wallMsg.trim()}>
            Post
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {teamWall.length === 0 && <div style={{ color: "var(--chalk-dim)", fontSize: 15 }}>Nothing posted yet. Be the first!</div>}
          {teamWall.slice(0, 30).map((post) => (
            <WallPost key={post.id} post={post} me={me} onReply={(reply) => onReplyWall(post.id, reply)} />
          ))}
        </div>
      </div>

      {!isCoach && (
      <div style={{ ...styles.card, marginTop: 14 }}>
        <div style={{ color: "var(--chalk)", fontSize: 17, fontWeight: 700, marginBottom: 4 }}>📮 Anonymous Message to Coach</div>
        <div style={styles.privacyNoteSmall}>
          🔒 No name or number is attached, and teammates can't read it here — only the coach view lists these messages.
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          {COACH_PRESETS.map((t) => (
            <button key={t} onClick={() => setCoachMsg(t)} style={styles.quickChip}>
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={coachMsg}
          onChange={(e) => setCoachMsg(e.target.value)}
          placeholder={`Say something to Coach ${COACH_NAME.replace("Mr. ", "")}\u2026`}
          style={{ ...styles.input, minHeight: 72, resize: "vertical", marginTop: 12, marginBottom: 10 }}
        />
        <button style={{ ...styles.primaryBtn, width: "100%" }} onClick={send} disabled={!coachMsg.trim()}>
          {justSent ? "Sent \u2713" : "Send Anonymously"}
        </button>
      </div>
      )}

      <div style={{ ...styles.card, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "var(--chalk)", fontSize: 17, fontWeight: 700 }}>📖 Soccer Rules Q&amp;A</div>
          <button onClick={() => setShowRules((s) => !s)} style={{ ...styles.skipBtn, padding: 0 }}>
            {showRules ? "Hide" : "Show"}
          </button>
        </div>
        {showRules && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {RULES_QA.map((item, i) => (
              <div key={i} style={styles.gameRow}>
                <div style={{ color: "var(--chalk)", fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{item.q}</div>
                <div style={{ color: "var(--chalk-dim)", fontSize: 15 }}>{item.a}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...styles.card, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "var(--chalk)", fontSize: 17, fontWeight: 700 }}>🏃 Warm-Up &amp; Movement Tips</div>
          <button onClick={() => setShowWarmupTips((s) => !s)} style={{ ...styles.skipBtn, padding: 0 }}>
            {showWarmupTips ? "Hide" : "Show"}
          </button>
        </div>
        {showWarmupTips && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {WARMUP_TIPS.map((item, i) => (
              <div key={i} style={styles.gameRow}>
                <div style={{ color: "var(--chalk)", fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{item.q}</div>
                <div style={{ color: "var(--chalk-dim)", fontSize: 15 }}>{item.a}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...styles.card, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "var(--chalk)", fontSize: 17, fontWeight: 700 }}>🧠 Mental Game Tips</div>
          <button onClick={() => setShowMentalTips((s) => !s)} style={{ ...styles.skipBtn, padding: 0 }}>
            {showMentalTips ? "Hide" : "Show"}
          </button>
        </div>
        {showMentalTips && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {MENTAL_TIPS.map((item, i) => (
              <div key={i} style={styles.gameRow}>
                <div style={{ color: "var(--chalk)", fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{item.q}</div>
                <div style={{ color: "var(--chalk-dim)", fontSize: 15 }}>{item.a}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Same reason as cheers: a number or a custom avatar next to a post you just
// wrote hands your number to whoever is standing beside you.
const whoLabel = (from, me) => (from === me ? "You" : from === "coach" ? `Coach ${COACH_NAME.replace("Mr. ", "")}` : "A teammate");

function WallPost({ post, me, onReply }) {
  const [showReply, setShowReply] = useState(false);
  const [replyMsg, setReplyMsg] = useState("");
  const submit = () => {
    if (!replyMsg.trim()) return;
    onReply(replyMsg);
    setReplyMsg("");
    setShowReply(false);
  };

  return (
    <div style={{ ...styles.cheerRow, display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <span style={{ color: "var(--sky)", fontWeight: 600, fontSize: 14 }}>{whoLabel(post.from, me)}</span>
        <div style={{ color: "var(--chalk)", fontSize: 15, marginTop: 2 }}>{post.message}</div>

        {(post.replies || []).length > 0 && (
          <div style={{ marginTop: 8, paddingLeft: 10, borderLeft: "2px solid var(--line)", display: "flex", flexDirection: "column", gap: 6 }}>
            {post.replies.map((r) => (
              <div key={r.id} style={{ fontSize: 14 }}>
                <span style={{ color: "var(--sky)", fontWeight: 600 }}>{whoLabel(r.from, me)}</span>{" "}
                <span style={{ color: "var(--chalk-dim)" }}>{r.message}</span>
              </div>
            ))}
          </div>
        )}

        {showReply ? (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} placeholder="Reply\u2026" style={{ ...styles.input, flex: 1, padding: "8px 10px", fontSize: 15 }} />
            <button onClick={submit} style={{ ...styles.primaryBtn, padding: "8px 14px" }}>Send</button>
          </div>
        ) : (
          <button onClick={() => setShowReply(true)} style={{ ...styles.skipBtn, marginTop: 8, padding: 0, textAlign: "left" }}>
            + Reply
          </button>
        )}
      </div>
    </div>
  );
}

function LeaderboardTab({ points, players, cheers, avatarStyles, aggregateCheckins }) {
  const ranked = [...players].sort((a, b) => (points[b] || 0) - (points[a] || 0));
  const cheerCountOf = (p) => cheers.filter((c) => c.from === p && inThisWeek(c.ts)).length;
  const weeklyBuckets = getWeeklyCheckinBuckets(aggregateCheckins, 12);
  const maxBucket = Math.max(...weeklyBuckets, 1);
  return (
    <div>
      <div style={styles.card}>
        <div style={{ color: "var(--chalk-dim)", fontSize: 14, marginBottom: 4 }}>This Week's Ranking</div>
        <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginBottom: 12 }}>Everyone starts from zero every Monday. Has nothing to do with check-ins — every 5 cheers this week grows your crown.</div>
        {ranked.length === 0 && <div style={{ color: "var(--chalk-dim)", fontSize: 15 }}>No records yet.</div>}
        {ranked.map((p, i) => {
          const count = cheerCountOf(p);
          const { current, next } = getCrownInfo(count);
          const s = avatarStyles[p] || {};
          return (
            <div key={p} style={styles.rankRow}>
              <span className="lineup-mono" style={{ color: i === 0 ? "var(--amber)" : "var(--chalk-dim)", width: 20 }}>{i + 1}</span>
              <PlayerAvatar number={p} size={38} glasses={s.glasses} furStyle={s.furStyle} bow={s.bow} bowColor={s.bowColor} skinTone={s.skinTone} hairColor={s.hairColor} sockColor={s.sockColor} color={s.jerseyColor || "var(--turf-bright)"} />
              <span style={{ flex: 1 }}>
                <span style={{ color: "var(--chalk)", fontWeight: 600 }}>#{p}</span>
                <div style={{ fontSize: 13, color: "var(--chalk-dim)", marginTop: 2 }}>
                  {current ? (
                    <span>
                      <span style={{ fontSize: current.size }}>👑</span>{" "}
                      <span style={{ color: "var(--amber)" }}>{current.label}</span>
                      {next && <span> · {next.min - count} cheers to next crown</span>}
                    </span>
                  ) : (
                    <span>{5 - count} cheers to first crown</span>
                  )}
                </div>
              </span>
              <span className="lineup-mono" style={{ color: "var(--turf-bright)" }}>{points[p] || 0}pt</span>
            </div>
          );
        })}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
          <div style={{ color: "var(--chalk-dim)", fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Crown Tiers</div>
          {CROWN_TIERS.map((t) => (
            <div key={t.min} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <span style={{ fontSize: t.size, width: 44 }}>👑</span>
              <span style={{ color: "var(--chalk)", fontSize: 15, flex: 1 }}>{t.label}</span>
              <span className="lineup-mono" style={{ color: "var(--chalk-dim)", fontSize: 14 }}>{t.min}+ cheers</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: 14 }}>
        <div style={{ color: "var(--chalk-dim)", fontSize: 14, marginBottom: 2 }}>Season Trend</div>
        <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginBottom: 12 }}>
          Team-wide check-ins per week, last 12 weeks — anonymous, useful for end-of-semester recognition.
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 70 }}>
          {weeklyBuckets.map((v, i) => (
            <div key={i} title={`${v} check-ins`} style={{ flex: 1, height: `${Math.max(4, Math.round((v / maxBucket) * 100))}%`, background: i === weeklyBuckets.length - 1 ? "var(--turf-bright)" : "var(--sky)", borderRadius: 3, opacity: v === 0 ? 0.2 : 1 }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--chalk-dim)", fontSize: 12, marginTop: 6 }}>
          <span>12 weeks ago</span>
          <span>This week</span>
        </div>
      </div>
    </div>
  );
}

/* ── Tab Bar / Toast ───────────────────────── */

function TabBar({ tab, setTab }) {
  const tabs = [
    { key: "checkin", label: "Check In" },
    { key: "cheer", label: "Cheer" },
    { key: "challenge", label: "Challenge" },
    { key: "board", label: "Ranking" },
    { key: "team", label: "Team" },
  ];
  return (
    <div style={styles.tabBar}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => setTab(t.key)} style={{ ...styles.tabBtn, color: tab === t.key ? "var(--turf-bright)" : "var(--chalk-dim)", borderTop: tab === t.key ? "2px solid var(--turf-bright)" : "2px solid transparent" }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Toast({ text }) {
  return <div style={styles.toast}>{text}</div>;
}

// Small persistent badge pinned to the screen edge — the closest thing to a
// "widget" that a page inside a browser tab can do (a real lock-screen or
// home-screen widget needs a native app or an installed PWA, not a preview).
function FloatingBadge({ todayCount, totalPlayers, onTap }) {
  return (
    <button onClick={onTap} style={styles.floatingBadge}>
      <span style={{ fontSize: 18 }}>🛡️</span>
      <span className="lineup-mono" style={{ fontSize: 14, color: "var(--chalk)" }}>
        {todayCount}/{Math.max(totalPlayers, 1)}
      </span>
    </button>
  );
}

/* ── Styles ────────────────────────────────── */

const styles = {
  app: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" },
  center: { display: "flex", alignItems: "center", justifyContent: "center" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 18px 12px" },
  content: { padding: "8px 18px 120px", flex: 1 },
  card: { background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: 16, padding: 20 },
  coachCard: { marginTop: 16, background: "rgba(242,169,59,0.1)", border: "1px solid rgba(242,169,59,0.35)", borderRadius: 12, padding: "14px 16px" },
  cueBox: {
    background: "var(--bg-elev2)",
    border: "1px solid var(--line)",
    borderRadius: 12,
    padding: "14px 16px",
    color: "var(--chalk)",
    fontSize: 19,
    fontWeight: 600,
    textAlign: "center",
    marginBottom: 8,
  },
  goalBox: {
    position: "relative",
    height: 210,
    background: "linear-gradient(180deg, rgba(95,168,90,0.15), rgba(95,168,90,0.03))",
    borderRadius: 14,
    border: "1px solid var(--line)",
    overflow: "hidden",
  },
  goalNet: {
    position: "absolute",
    top: 14,
    left: "8%",
    right: "8%",
    height: 92,
    border: "4px solid var(--chalk-dim)",
    borderBottom: "none",
    backgroundImage:
      "repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(241,239,231,0.15) 11px), repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(241,239,231,0.15) 11px)",
  },
  arena: {
    position: "relative",
    background: "linear-gradient(180deg, rgba(95,168,90,0.15), rgba(95,168,90,0.03))",
    borderRadius: 14,
    border: "1px solid var(--line)",
    overflow: "hidden",
    touchAction: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  arenaHint: { position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center", color: "var(--chalk)", fontSize: 15, fontWeight: 600, pointerEvents: "none", padding: "0 12px" },
  arenaBigCount: { position: "absolute", top: "30%", left: 0, right: 0, textAlign: "center", fontSize: 64, color: "rgba(241,239,231,0.12)", pointerEvents: "none" },
  powerTrack: { position: "relative", height: 18, marginTop: 12, borderRadius: 9, background: "var(--bg-elev2)", border: "1px solid var(--line)", overflow: "hidden" },
  powerZone: { position: "absolute", top: 0, bottom: 0, left: "35%", width: "50%", background: "rgba(95,168,90,0.45)" },
  powerMarker: { position: "absolute", top: -2, bottom: -2, width: 6, marginLeft: -3, background: "var(--amber)", borderRadius: 3 },
  ball: {
    position: "absolute",
    fontSize: 38,
    transform: "translateX(-50%)",
  },
  shotResult: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: "center",
    fontWeight: 800,
    fontSize: 28,
  },
  privacyNote: { background: "rgba(127,168,201,0.12)", border: "1px solid rgba(127,168,201,0.3)", color: "var(--sky)", fontSize: 14, borderRadius: 12, padding: "12px 14px", lineHeight: 1.55 },
  privacyNoteSmall: { background: "rgba(127,168,201,0.1)", color: "var(--sky)", fontSize: 13, borderRadius: 10, padding: "8px 12px", display: "inline-block", lineHeight: 1.5 },
  // No inner scroll box: on iPhone Safari a tap inside a nested scroller is
  // often taken as the start of a scroll and never becomes a click.
  numberGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, padding: 8, background: "var(--bg-elev)", borderRadius: 12, border: "1px solid var(--line)" },
  numberCell: { borderWidth: 2, borderStyle: "solid", borderRadius: 10, padding: "12px 0", fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono', monospace", touchAction: "manipulation", WebkitTapHighlightColor: "transparent" },
  lineupBoardWrap: { padding: "0 18px 16px", borderBottom: "1px solid var(--line)", marginBottom: 16 },
  trackLane: { background: "linear-gradient(180deg, rgba(95,168,90,0.08), rgba(95,168,90,0.02))", borderRadius: 14, padding: "12px 12px 6px" },
  lineupBoardEmpty: { padding: "0 18px 16px", borderBottom: "1px solid var(--line)", marginBottom: 16, color: "var(--chalk-dim)", fontSize: 15 },
  // 16px keeps iOS Safari from auto-zooming the page whenever a field is focused.
  input: { width: "100%", background: "var(--bg-elev2)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 16px", color: "var(--chalk)", fontSize: 16, outline: "none" },
  primaryBtn: { background: "var(--turf-bright)", color: "#10151A", border: "none", borderRadius: 12, padding: "16px 20px", fontSize: 17, fontWeight: 700, cursor: "pointer", minHeight: 52 },
  backBtn: { background: "transparent", border: "none", color: "var(--chalk-dim)", fontSize: 15, padding: "8px 0", marginBottom: 6, cursor: "pointer", touchAction: "manipulation" },
  skipBtn: { background: "transparent", color: "var(--chalk-dim)", border: "none", padding: "12px 0", fontSize: 15, cursor: "pointer", width: "100%", textAlign: "center" },
  moodBtn: { border: "1px solid var(--line)", borderRadius: 12, padding: "14px 18px", fontSize: 16, fontWeight: 600, cursor: "pointer", minHeight: 52 },
  chip: { border: "1px solid var(--line)", borderRadius: 22, padding: "10px 16px", fontSize: 15, background: "transparent", cursor: "pointer", minHeight: 42 },
  quickChip: { border: "1px solid var(--line)", borderRadius: 22, padding: "9px 14px", fontSize: 14, background: "var(--bg-elev2)", color: "var(--chalk-dim)", cursor: "pointer", minHeight: 40 },
  composer: { background: "var(--bg-elev2)", borderWidth: 1, borderStyle: "solid", borderRadius: 16, padding: "12px 12px 10px", transition: "border-color 0.15s, box-shadow 0.15s" },
  composerText: { flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", resize: "none", color: "var(--chalk)", fontSize: 16, lineHeight: 1.45, fontFamily: "inherit", padding: "4px 2px" },
  composerIcon: { position: "relative", flexShrink: 0, width: 46, height: 46, borderRadius: 12, border: "1px solid rgba(242,169,59,0.4)", background: "rgba(242,169,59,0.12)", fontSize: 26, lineHeight: 1, cursor: "pointer", padding: 0 },
  composerIconX: { position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 9, background: "var(--bg-elev)", border: "1px solid var(--line)", color: "var(--chalk-dim)", fontSize: 12, lineHeight: "16px" },
  cheerBadge: { flexShrink: 0, width: 40, height: 40, borderRadius: 20, background: "var(--bg-elev2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 },
  cheerRow: { background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 14px", fontSize: 15 },
  gameRow: { background: "var(--bg-elev2)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 14px", marginBottom: 10 },
  homeAwayTag: { fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 10, letterSpacing: 0.5 },
  progressTrack: { width: "100%", height: 12, background: "var(--bg-elev2)", borderRadius: 6, marginTop: 14, overflow: "hidden" },
  progressFill: { height: "100%", background: "var(--sky)", transition: "width 0.4s ease" },
  taskRow: { display: "flex", alignItems: "center", gap: 12, width: "100%", background: "var(--bg-elev2)", border: "1px solid var(--line)", borderRadius: 12, padding: "15px 14px", cursor: "pointer", textAlign: "left", minHeight: 54 },
  rankRow: { display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--line)" },
  // Extra bottom padding keeps the bar clear of the iPhone home indicator.
  tabBar: { position: "sticky", bottom: 0, display: "flex", background: "var(--bg-elev)", borderTop: "1px solid var(--line)", paddingBottom: "env(safe-area-inset-bottom, 0px)" },
  tabBtn: { flex: 1, background: "transparent", border: "none", padding: "16px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", minHeight: 58 },
  switchPlayerBtn: { background: "transparent", border: "none", color: "var(--chalk-dim)", fontSize: 13, textDecoration: "underline", cursor: "pointer", padding: "4px 0" },
  avatarTapBtn: { background: "transparent", border: "none", padding: 0, cursor: "pointer" },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  },
  modalCard: {
    background: "var(--bg-elev)",
    border: "1px solid var(--line)",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "90vh",
    overflowY: "auto",
  },
  profileRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid var(--line)",
    color: "var(--chalk)",
    fontSize: 16,
  },
  toast: { position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "var(--turf-bright)", color: "#10151A", padding: "12px 20px", borderRadius: 22, fontSize: 15, fontWeight: 700, boxShadow: "0 4px 14px rgba(0,0,0,0.3)", zIndex: 50, maxWidth: "90%", textAlign: "center" },
  kudosBtn: {
    flex: "1 1 0",
    minWidth: 0,
    minHeight: 64,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 12,
    padding: "8px 2px",
    cursor: "pointer",
    touchAction: "manipulation",
  },
  questTrail: {
    position: "relative",
    height: 84,
    marginBottom: 16,
    background: "linear-gradient(180deg, rgba(142,39,64,0.22), rgba(142,39,64,0.05))",
    borderRadius: 14,
    border: "1px solid var(--line)",
    overflow: "hidden",
  },
  balloonOverlay: { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 40, overflow: "hidden" },
  floatingBadge: {
    position: "absolute",
    right: 14,
    bottom: 100,
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: "var(--bg-elev2)",
    border: "1px solid var(--line)",
    borderRadius: 22,
    padding: "10px 16px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
    cursor: "pointer",
    zIndex: 45,
  },
  footerNote: { textAlign: "center", color: "var(--chalk-dim)", fontSize: 13, padding: "12px 0 22px", background: "var(--bg)" },
};
