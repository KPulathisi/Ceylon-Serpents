# Ceylon Serpents

**Discover. Understand. Respect.**

An immersive, trilingual (English · සිංහල · தமிழ்) educational field guide to the snakes of Sri Lanka. It's built as a fully static Vue 3 site: no backend, no database, no accounts, no tracking.

The site is a **source of knowledge first**. Its photo-matching tool is a clearly labelled, non-diagnostic learning aid. The snakebite safety page never depends on identification.

---

## Features

| Area | What it does |
| --- | --- |
| **Home** | A cinematic hero with a museum-style specimen label, featured species, a habitat map, animated locomotion diagrams, myth cards, a featured article and the safety message |
| **Snake library** | 15 curated species. Search by English, Sinhala, Tamil or scientific name; filter by habitat, endemic status, group and medical importance; switch between gallery and field-list views |
| **Species profiles** | Names in three languages (with verified/provisional flags), classification, appearance, variation, ecology, behaviour, defence, distribution, **identification limitations**, folklore, similar species, references and last-reviewed date |
| **Compare** | Two or three species side by side. The comparison can be shared through its URL (`#/compare?ids=a,b,c`) |
| **Identify a snake** | Upload a photo (it stays in the browser), read the privacy notice, then answer five visual questions to get a ranked list of possible matches. A local colour analysis *suggests* the colour answer. It never invents confidence scores |
| **Habitats** | An illustrated island map with generalised climatic zones and seven habitat types, with the species recorded in each |
| **Knowledge corner** | Behaviour topics, four interactive locomotion diagrams, myths vs facts (each labelled as folklore, cultural belief or unsupported claim), and articles |
| **My collection** | Save species and articles to `localStorage`, with graceful handling when storage is blocked |
| **Snakebite safety** | Image-free and fast-loading, with first-aid do's and don'ts and the 1990 Suwa Seriya ambulance number, in three languages |

Accessibility: semantic HTML, keyboard navigation, visible focus, skip link, alt text, text alternatives for diagrams, `prefers-reduced-motion` support, and medical status shown by **icon + text**, never colour alone.

## Tech stack

- Vue 3 (Composition API, `<script setup>`) and Vite
- Vue Router with **hash history**, so direct refreshes work on any static host
- GSAP + ScrollTrigger for one orchestrated hero entrance and subtle parallax
- Lucide icons
- Self-hosted fonts through Fontsource: Abhaya Libre (Latin + Sinhala serif), Noto Sans, Noto Sans Sinhala, Noto Sans Tamil and Noto Serif Tamil
- All content in local JSON

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # outputs dist/
npm run preview   # serve the production build
```

## Deployment

The build uses relative paths (`base: './'`) and hash routing, so `dist/` works anywhere.

- **GitHub Pages:** push to `main`. `.github/workflows/deploy.yml` builds and deploys automatically. In the repo, go to *Settings → Pages* and set *Source* to **GitHub Actions**.
- **Cloudflare Pages:** set the build command to `npm run build` and the output directory to `dist`.
- **Vercel:** use the Vite framework preset (output `dist`).

No environment variables or secrets are needed.

## Project structure

```
src/
  data/          species, habitats, behavior, myths, articles, sources, imageCredits (JSON)
  locales/       en.json, si.json, ta.json (all UI strings)
  components/    SpeciesCard, SpeciesPlate (SVG illustration), SpeciesMedia, HabitatMap,
                 BehaviorDiagram, MythFactCard, SafetyNotice, LanguageSwitcher, …
  pages/         Home, SnakeLibrary, SpeciesDetail, Compare, ImageMatching,
                 HabitatExplorer, KnowledgeCorner, Article, Collection,
                 EmergencyInformation, Sources
  composables/   useLanguage, useSpeciesSearch, useLocalCollection, useData, useClassifier
  styles/        main.css (design tokens and base styles)
public/images/   optimised WebP photos (full + -sm sizes)
```

### Adding a species

Add an object to `src/data/species.json`. The interface picks it up automatically. Required fields: a unique `id`, a verified `scientificName`, `names` (with `status` set to `verified`, `provisional` or `unavailable`), `traits` (used by the identification guide), `plate` (colours and pattern for the SVG illustration when there's no photo), `en` text, `references` and `lastReviewed`. Add photos to `public/images/` as `name.webp` and `name-sm.webp`, and record each one in `imageCredits.json`.

## Content review process

1. Scientific names follow **The Reptile Database**. Taxonomic changes are noted in the text (for example, *Craspedocephalus* was formerly *Trimeresurus*, and *Fowlea* was formerly *Xenochrophis*).
2. Local names are marked **verified** only when they match a Sri Lankan source (the Snake Identification Service of Sri Lanka, SLMA). Otherwise they are **provisional** (marked \*) or **unavailable**. Nothing is machine-translated silently.
3. Safety and first-aid text follows **SLMA** and **WHO** guidance.
4. Myths are labelled by type, and no folklore has been invented.
5. **Before public launch:** a herpetologist should review the species text, a medical professional the safety text, and native speakers the Sinhala and Tamil text. These translations are currently labelled as drafts in the interface.

## Known limitations

- **No AI species recognition.** No validated Sri Lankan snake-classification model exists for this project, so the identification page uses a transparent, question-based guide instead of pretending to run inference. `src/composables/useClassifier.js` provides the hook for a real model. To add one: train on licensed, labelled Sri Lankan images with an "unknown" class, evaluate it on held-out and look-alike species, export it to TF.js/ONNX in `public/model/`, document its metrics, and lazy-load it only on the identify page.
- The species list is a starting selection, not a complete checklist. Sri Lanka has more than 100 snake species.
- Detailed species prose is in English. Summaries, names, the interface and safety content are in all three languages.
- Conservation assessments have not yet been added.
- **Image licences are not verified.** The photographs came from the reference images in the project brief. Replace them with licensed images (for example from Wikimedia Commons or iNaturalist with CC licences) or get permission before any public deployment. See `src/data/imageCredits.json`. Species without a verified photo use a generated SVG illustration, which is clearly labelled.

## Key sources

- Sri Lanka Medical Association: Snakebite Prevention & First Aid; Expert Committee on Snakebite
- WHO: Snakebite envenoming; Guidelines for the Management of Snakebites (SEARO)
- Snake Identification Service of Sri Lanka: Common Snakes of Sri Lanka
- The Reptile Database
- Peer-reviewed literature listed in `src/data/sources.json`

---

*Not a medical or emergency service. If a snakebite occurs, go to the nearest hospital or call 1990 immediately.*
