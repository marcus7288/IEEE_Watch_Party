# IEEE Career Fair Watch Party — Check-In (Netlify version)

A static check-in/reflection form with a Netlify serverless function backend,
using Netlify Blobs for storage. Same fields and behavior as the Claude
artifact version: public "who's checked in" list, a running count, and a
key-gated instructor view with full responses and a reset button.

## Files

- `index.html` — the page (form, list, admin view). No build step needed.
- `netlify/functions/checkin.js` — the API: GET (list), POST (add a
  check-in), DELETE (clear all, instructor-key protected).
- `netlify.toml` — tells Netlify where the function lives and maps
  `/api/checkin` to it.
- `package.json` — the one dependency (`@netlify/blobs`).

## Deploy steps

1. **Push this folder to GitHub.** Create a new repo (e.g.
   `ieee-career-fair-checkin`), and push these files to it — same as any
   other project you'd put on GitHub.

2. **Go to app.netlify.com and click "Add new site" → "Import an existing
   project."** Choose GitHub, authorize if asked, and pick the repo you
   just created.

3. **Build settings:** leave the build command blank (there isn't one —
   this is a static file plus a function) and set the publish directory to
   `.` (the repo root). Netlify auto-detects `netlify/functions` from
   `netlify.toml`, so you shouldn't need to touch anything else here.

4. **Deploy.** Click "Deploy site." Netlify will give you a random
   `something-random-123.netlify.app` URL — that's your live check-in
   form immediately, no extra setup required for the storage side; Netlify
   Blobs works automatically for any site's functions.

5. **Set your instructor key.** In the site's dashboard, go to **Site
   configuration → Environment variables → Add a variable**. Name it
   `INSTRUCTOR_KEY`, set the value to any secret string you choose (e.g.
   something like `evangel-cs-2026`), and save. Then **trigger a redeploy**
   (Deploys tab → "Trigger deploy" → "Deploy site") so the function picks
   up the new variable.

6. **Test it.** Open your Netlify URL, submit a test check-in, then open
   `your-url.netlify.app/?key=YOUR_SECRET` (using the value you set in
   step 5) — you should see the full-response table and the "Clear all
   check-ins" button. Use that button to wipe your test data before the
   real event.

7. **(Optional) Custom domain / nicer URL.** Under **Site configuration →
   Domain management**, you can add a custom domain if you have one, or
   just rename the site (Site configuration → General → Change site name)
   to get a friendlier `*.netlify.app` URL like
   `ieee-career-fair-evangel.netlify.app`.

## Sharing the links

- **Students / other schools:** share the plain site URL — nobody needs a
  login, and it works for anyone regardless of school.
- **You (grading):** use the same URL with `?key=YOUR_SECRET` appended,
  from step 5. Keep that full URL private — anyone with it can see full
  responses and clear all data.

## Notes

- Every check-in is a small serverless function call — no database to set
  up separately, and it's within Netlify's free tier for an event this
  size.
- If two students submit at the exact same instant, there's a very small
  chance one write could be lost (Blobs doesn't have a true atomic
  transaction here) — a short retry is built in, but for a live event
  with a handful of simultaneous submitters at most, this is not a
  practical concern.
- To reuse this next year: either clear the data via the instructor view,
  or just redeploy — Blobs storage isn't wiped by redeploys, so use the
  Clear button rather than assuming a fresh deploy starts empty.
