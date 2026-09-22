# LINE UP — MPrep Girls' Soccer JV

Installable PWA for the Marianapolis Prep Golden Knights: daily check-in,
warm-up stretches, cheers, team schedule, soccer knowledge and the Knight's
Quest mini-games.

## Run it

```bash
npm install
npm run icons     # regenerate app icons from scripts/make-icons.mjs
npm run dev       # http://localhost:5173
npm run build && npm run preview
```

`npm run dev` works with no configuration. Without Supabase keys the app runs
**single-device**: everything is stored in that browser's localStorage, so
cheers and check-in counts are not shared between phones.

## Turning on team sync

Personal data (mood log, streak, stretch log) always stays on the device — it
is never uploaded, which is a little stronger than what the UI promises.
Only the shared team state syncs.

1. Create a Supabase project, then run this in its SQL editor:

   ```sql
   create table team_state (
     key text primary key,
     value jsonb not null,
     updated_at timestamptz not null default now()
   );

   alter table team_state enable row level security;

   -- The app has no logins, so the anon key needs read + write on this table.
   -- Nothing here identifies a student: jersey numbers only, and moods never
   -- leave the phone.
   create policy "team read"   on public.team_state for select using (true);
   create policy "team insert" on public.team_state for insert with check (true);
   create policy "team update" on public.team_state for update using (true) with check (true);

   -- Policies decide which rows are visible; this decides whether the anon
   -- role may touch the table at all. New Supabase projects do not grant it
   -- automatically, and without it every request fails with 42501.
   grant select, insert, update on public.team_state to anon;
   ```

2. Copy `.env.example` to `.env` and fill in the two values from
   Supabase → Project Settings → API.

3. Restart `npm run dev`. The console prints a note when sync is off.

## Deploying

Vercel, same as the SAT app:

```bash
npx vercel --prod
```

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under the project's
Environment Variables, then redeploy so the build picks them up.

## Installing on a phone

Once it is on HTTPS:

- **iPhone (Safari):** Share → Add to Home Screen. Opens fullscreen, no
  browser bar.
- **Android (Chrome):** the install prompt appears on its own, or
  menu → Install app.

## Known limits

- **Last write wins.** The whole team blob is written at once, so two players
  saving at the same moment can overwrite each other. Fine for a 15-player
  squad; worth splitting into per-row writes if it becomes a problem.
- **Shared state is read once at launch.** Pull to refresh (or reopen) to see
  teammates' new posts.
- **Anonymous ≠ private.** The coach inbox is readable by anyone who opens the
  team tab; the UI says so.
