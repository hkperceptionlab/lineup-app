# LINE UP

An installable web app for the Marianapolis Prep Girls' Soccer JV team — the
Golden Knights. A private daily check-in, guided warm-up stretches, cheers
for the team, the season schedule, soccer knowledge, a four-level skill-game
series, and an unscored breathing corner for pre-game nerves.

**Live:** https://hkperceptionlab.github.io/lineup-app/ (team word required)

---

## Why the interesting parts are the things it doesn't do

Most of the work on this app went into deciding what to leave out. A team app
for 14-year-olds has an obvious failure mode: it becomes a place where a
teenager's bad day is visible to everyone, or where the app quietly turns
"who is struggling" into data. Each decision below was made against that.

### Mood never leaves the phone

The check-in asks how you're feeling. That answer is written to `localStorage`
and **is never uploaded** — not to the database, not anywhere. What the team
sees is a single number: how many people checked in today, with no identity
attached.

This is enforced in the storage layer rather than by convention. `storage.js`
splits on the `shared` flag the component already passed: `shared: false` goes
to the device, `shared: true` goes to Supabase. There is no code path that
sends a mood anywhere.

### Points come from cheering, never from checking in

If checking in earned points, the leaderboard would quietly become a list of
who is keeping up and who isn't — exactly the thing a struggling player does
not need. `submitCheckin` doesn't touch `socialPoints` at all.

Cheer points are also capped: three cheers a day. Without that cap the top of
the leaderboard is just whoever typed "ok" thirty times.

### Numbers are made up, so cheers go to the team

Players pick any number they like — explicitly *not* their real jersey
number, or the number would just be their name with extra steps. The cost of
that is that nobody knows who #7 is, and asking a new player to cheer a
stranger (which onboarding used to do) is awkward. So a cheer is addressed to
the whole team, and the onboarding "first cheer" step is gone.

The number isn't printed next to cheers or wall posts either — they show as
"You" or "A teammate". Send a cheer standing next to a friend and "#68" pops
up right then, which hands them your number, and with it your ranking.
Crowns and points still count by number underneath; only the ranking shows
it, since a ranking has to name someone.

### The warm-up voice is pre-rendered

Phone voices range from decent to robotic, and which one you get depends on
the phone. So every spoken line is an MP3 in `public/voice/`, rendered once
with [Kokoro](https://github.com/hexgrad/kokoro) (Apache-2.0, voice
`af_heart`) by `scripts/make_voice.py`, loudness-normalized so it carries
outdoors, and precached for offline use (~0.7 MB). Everyone hears the same
natural voice. The device voice (`pickVoice`, best available first) is only
the fallback if a clip fails to load.

If a move's `say` text changes, re-run the script — it reads the lines from
the app source, so clip and script can't drift apart.

### The calm corner has no score

Knight's Quest is four real games — juggling, a penalty with aim and power
timing, a focus game (follow the gold balls through a shuffle), and a
goalkeeper round. The breathing exercises next to it are deliberately not a
level: no pass or fail, no points, nothing saved. Grading the thing meant to
calm you down defeats the point.

### The anonymous wall was built, then removed

An earlier version had *"How Are You, Really?"* — an anonymous space where
players could post that they were having a hard time and others could reply.
It was the nicest idea in the app. It was removed before release, for two
reasons:

1. **No adult in the loop.** There was no delete, no report, no coach
   visibility. If something serious appeared at 11pm, nobody could act on it.
2. **It promised an anonymity it couldn't keep.** On a 15-player squad, a
   timestamp plus a rough sense of who is awake narrows a post to a couple of
   people. Believing you are anonymous and then being identified is worse than
   never having the space at all.

What replaced it is deliberately smaller: **icon-only team kudos.** Five fixed
icons, sent to the whole team, with no sender, no recipient, no count and no
points. A closed vocabulary cannot carry an insult or a crisis, so there is
nothing to moderate. And tapping an icon is a far lower bar than typing "I'm
struggling", so more people actually use it.

Anything heavy still has a route — the anonymous coach inbox — which goes to
someone who can respond.

### The passcode is a doorbell, not a lock

The app has no logins, so anyone with the URL could claim a player number and
post to the team wall. `PasscodeGate` asks for a word the coach hands out.

It is honest about what it is. This is a static site: the expected word ships
inside the JavaScript bundle, next to the Supabase publishable key, so anyone
determined can skip the screen and query the database directly. It stops the
accidental visitor, which is the realistic threat. Real protection would mean
Supabase Auth with row-level security, where the check runs server-side — a
worthwhile trade only if the data ever becomes worth it. Made-up numbers and
"Let's go!" are not.

### The day runs on Thompson, Connecticut

Dates were originally derived from `toISOString()`, which is UTC. In Connecticut
that flips the date at 8pm — a Thursday evening check-in was recorded as
Friday, and streaks broke for no visible reason. Every date key now formats
through `Intl.DateTimeFormat` pinned to `America/New_York`, so the team's day
is the school's day no matter where the phone is.

---

## Architecture

A single React component, deliberately portable. The host-specific pieces are
kept at the edges so the app itself never had to be rewritten:

```
src/
  TeamLineupApp.jsx   the whole app; talks to a window.storage interface
  storage.js          installs that interface (localStorage + Supabase)
  PasscodeGate.jsx    wraps the app, not part of it
  main.jsx            wiring
```

`storage.js` implements the same two-method interface the component was
originally written against, so `TeamLineupApp.jsx` runs unmodified in either
environment. Swapping the backend is one file.

## Running it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build
npm run icons     # regenerate app icons
```

Works with no configuration. Without Supabase keys the app runs single-device:
everything is in that browser's storage, so nothing is shared between phones.

## Team sync

1. In the Supabase SQL editor:

   ```sql
   create table public.team_state (
     key        text primary key,
     value      jsonb not null,
     updated_at timestamptz not null default now()
   );

   alter table public.team_state enable row level security;

   create policy "team read"   on public.team_state for select using (true);
   create policy "team insert" on public.team_state for insert with check (true);
   create policy "team update" on public.team_state for update using (true) with check (true);

   -- Policies decide which rows are visible; this decides whether the anon
   -- role may touch the table at all. New Supabase projects do not grant it
   -- automatically, and without it every request fails with 42501.
   grant select, insert, update on public.team_state to anon;
   ```

2. Copy `.env.example` to `.env` and fill in the values.

## Deploying

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. The three `VITE_*` values live in repo
Secrets — they are publishable client keys rather than secrets, kept there so
the team word can change without a commit.

Repo Settings → Pages → Source must be set to **GitHub Actions**.

## Installing on a phone

- **iPhone (Safari):** Share → Add to Home Screen
- **Android (Chrome):** the install prompt appears on its own, or menu →
  Install app

## Known limits

- **Last write wins.** The whole team blob is written at once, so two players
  saving in the same moment can overwrite each other. Acceptable at 15
  players; it would need per-row writes to scale.
- **Shared state is read once at launch.** Reopen the app to see new posts.
- **Anonymous is not private.** The coach inbox has no sender attached, but
  anyone who opens the team tab can read it. The UI says so.
