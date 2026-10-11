# Ceylon Serpents

**Discover. Understand. Respect.**

An immersive, trilingual (English · සිංහල · தமிழ்) educational field guide to the snakes of Sri Lanka. It's built as a static Vue 3 site with a local-only admin panel and optional AI photo suggestions powered by Google Gemini.

The site is a **source of knowledge first**. Photo identification is a clearly labelled, non-diagnostic learning aid. The snakebite safety page never depends on identification.

---

## Contents

1. [Features](#features)
2. [Run it locally](#run-it-locally)
3. [Admin panel](#admin-panel)
4. [AI identification setup (Gemini + Cloudflare Worker)](#ai-identification-setup)
5. [Deploying to GitHub Pages](#deploying-to-github-pages)
6. [Logo, photos and videos](#logo-photos-and-videos)
7. [Project structure](#project-structure)
8. [Content review and limitations](#content-review-and-limitations)

---

## Features

| Area | What it does |
| --- | --- |
| **Home** | A cinematic hero that cycles through every species with a photo, each with a museum-style specimen label; featured species; habitat map; movement videos/diagrams; myths; featured article; safety message |
| **Snake library** | Search by English, Sinhala, Tamil or scientific name; filter by habitat, endemic status, group and medical importance; gallery or field-list view; compare up to three species |
| **Species profiles** | Multiple photos with a primary photo and an automatic cross-fade slideshow; names in three languages with verified/provisional flags; full profile text; identification limitations; folklore; references |
| **Identify a snake** | Optional **AI suggestions from Gemini** (sent only with the visitor's consent, resized and stripped of location data), plus a question-based guide that works with no network at all. Never shows percentages or "safe/dangerous" verdicts |
| **Knowledge corner** | Behaviour; movement (videos, or animated diagrams until videos are added); **folklore and stories** with sources; myths vs facts; articles |
| **Habitats** | Island map with generalised zones and seven habitat types |
| **Snakebite safety** | Image-free, fast, trilingual first aid plus the 1990 ambulance number |
| **Admin (local only)** | Manage species, photos, folklore, myths, articles, habitats, sources and movement videos |

Accessibility: semantic HTML, keyboard navigation, visible focus, alt text, reduced-motion support (slideshows and the hero stop rotating), and medical status shown by icon + text, never colour alone.

## Run it locally

You need Node.js 20 or newer.

```bash
npm install
npm run dev       # site:  http://localhost:5173
                  # admin: http://localhost:5173/#/admin
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Admin panel

The admin panel is how you manage content. It exists **only while `npm run dev` is running on your own computer**:

- It writes directly into `src/data/*.json`, `public/images/` and `public/videos/`.
- It only accepts requests from this computer (localhost).
- It is **not included in the production build**, so the live site has no admin, no login and no way to change anything.

### Workflow

1. Run `npm run dev` and open `http://localhost:5173/#/admin`.
2. Make your changes. Each section has **Save**, and a backup of the previous file is kept in `.admin-backups/` (git-ignored).
3. Check the site at `http://localhost:5173`.
4. Publish:
   ```bash
   git add -A
   git commit -m "Update content"
   git push
   ```
   GitHub Actions rebuilds and deploys the site in a minute or two.

### What you can manage

- **Species:** every field, including names and their verification status, traits used by the question guide, illustration colours, profile text, translated summaries, similar species, references and review date. You can add or delete species.
- **Photos (per species):** upload several at once. They are resized automatically to WebP (1600px plus a 720px thumbnail). Choose the **primary** photo, reorder, add alt text, and record photographer, source and licence. When a species has two or more photos, the site cross-fades between them. Removed photos are deleted from disk when you save.
- **Folklore & stories, Myths & facts, Articles, Habitats, Sources:** add, edit and delete.
- **Movement videos:** upload or replace a video for each movement type, choose the Sri Lankan example species, and mark it as AI-generated. The prompts for generating them are in [`docs/VIDEO_PROMPTS.md`](docs/VIDEO_PROMPTS.md).

## AI identification setup

### Why a Worker?

A static site can't keep a secret: anything built into it, including values from GitHub secrets, ends up in the JavaScript every visitor downloads. So the Gemini key lives in a small **Cloudflare Worker** (free tier) that sits between the site and Google:

```
Visitor's browser ──photo──▶ Cloudflare Worker (holds GEMINI_API_KEY) ──▶ Google Gemini
                 ◀─suggestions─┘
```

The Worker (`worker/src/index.js`) only accepts requests from your site's address, checks the image type and size, asks Gemini for a cautious structured answer limited to your species list, and strips anything unexpected from the reply. It stores nothing.

### Step 1: protect the key in Google AI Studio

1. Open [Google AI Studio → API keys](https://aistudio.google.com/apikey).
2. Never commit the key to git or paste it into any file in this project.
3. Optional: in Google Cloud Console → APIs & Services → Credentials, restrict the key to the **Generative Language API** and set a daily quota you're comfortable with.
4. Note that on the free tier, Google may use submitted content to improve its products. Check the current Gemini API terms if that matters for your visitors.

### Step 2: deploy the Worker (about 10 minutes, one time)

1. Create a free account at [dash.cloudflare.com](https://dash.cloudflare.com/sign-up).
2. In a terminal:
   ```bash
   cd worker
   npm install
   npx wrangler login                     # opens the browser to authorise
   ```
3. Open `worker/wrangler.toml` and check `ALLOWED_ORIGINS`. It must list your live site's origin (`https://kpulathisi.github.io`, no path and no trailing slash) and `http://localhost:5173` for local testing. If you later use a custom domain, add it here.
4. Store the Gemini key as an encrypted Worker secret:
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   # paste the key when asked, then press Enter
   ```
5. Deploy:
   ```bash
   npm run deploy
   ```
   Wrangler prints the Worker URL, for example `https://ceylon-serpents-identify.<your-subdomain>.workers.dev`. Copy it.
6. Optional abuse protection: uncomment the `[[ratelimits]]` block in `wrangler.toml` (10 requests per minute per visitor) and deploy again.
7. If Google retires the default model, change `GEMINI_MODEL` in `wrangler.toml` to a current vision-capable model name from AI Studio and deploy again.

### Step 3: tell the site where the Worker is

- **For the live site (GitHub):** go to repository → **Settings → Secrets and variables → Actions → New repository secret**.
  - Name: `VITE_IDENTIFY_ENDPOINT`
  - Value: your Worker URL from step 2

  This is only the Worker's address, not the Gemini key. The deploy workflow injects it at build time.
- **For local testing:** copy `.env.example` to `.env.local` (git-ignored), put the Worker URL in it, and restart `npm run dev`.

If `VITE_IDENTIFY_ENDPOINT` isn't set, the site simply hides the AI option and uses the question-based guide.

## Deploying to GitHub Pages

1. In the repository on GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Add the `VITE_IDENTIFY_ENDPOINT` secret (see above).
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes the site to `https://kpulathisi.github.io/Ceylon-Serpents/`.

The site uses relative paths and hash routing, so it also works on Cloudflare Pages or Vercel (build `npm run build`, output `dist`).

## Logo, photos and videos

- **Logo:** put your logo at `public/logo.png`. The header uses it automatically and falls back to the drawn mark if the file is missing. A transparent PNG about 200px tall works well; it's displayed at 44px. If your logo already contains the words "Ceylon Serpents", delete the `<span class="wordmark">` line in `src/components/SiteHeader.vue`.
- **Photos:** add them through the admin panel. Each species' photo records hold their own credit and licence, which the Sources page lists automatically. Other site images (forest, historical plates) are credited in `src/data/imageCredits.json`.
- **Videos:** add them through the admin panel → Movement videos. They're stored in `public/videos/`.

> ⚠️ The starter photos came from the project brief and **their licences are not verified**. Replace them with photos you have the rights to (for example CC-licensed images from Wikimedia Commons or iNaturalist, credited properly) before promoting the site publicly.

## Project structure

```
admin/vite-admin-plugin.js   local admin API (dev server only)
worker/                      Cloudflare Worker for Gemini (deployed separately)
docs/VIDEO_PROMPTS.md        prompts for the four movement videos
src/
  admin/                     admin UI (only bundled in dev)
  data/                      species, folklore, myths, articles, habitats, behavior, sources, imageCredits
  locales/                   en.json, si.json, ta.json
  components/                SpeciesMedia (slideshow), SpeciesPlate, LocomotionMedia, FolkloreStory, …
  pages/                     Home, SnakeLibrary, SpeciesDetail, Compare, ImageMatching, HabitatExplorer,
                             KnowledgeCorner, Article, EmergencyInformation, Sources
  composables/               useLanguage, useSpeciesSearch, useLocalCollection (compare), useData, useClassifier
public/images, public/videos
```

## Content review and limitations

- Scientific names follow The Reptile Database. Local names are marked **verified** only when they match a Sri Lankan source; otherwise they're shown as **provisional** (\*) or **unavailable**. Nothing is silently machine-translated.
- Safety text follows SLMA and WHO guidance. Folklore entries cite their sources and are labelled as legend, tradition or belief.
- **Gemini is a general-purpose model, not a validated Sri Lankan snake classifier.** Its output is shown as "AI suggestions" with qualitative match strength, alongside the identification limitations and the safety notice.
- Long-form species text is in English. Names, summaries, interface and safety content are in all three languages, and the Sinhala/Tamil drafts should be reviewed by native speakers.
- Before public launch, have a herpetologist review the species text and a medical professional the safety text.

---

*Not a medical or emergency service. If a snakebite occurs, go to the nearest hospital or call 1990 immediately.*
