import species from '../data/species.json'
import habitats from '../data/habitats.json'
import behavior from '../data/behavior.json'
import myths from '../data/myths.json'
import articles from '../data/articles.json'
import sources from '../data/sources.json'
import imageCredits from '../data/imageCredits.json'

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]))

const speciesById = byId(species)
const habitatById = byId(habitats)
const sourceById = byId(sources)
const creditById = byId(imageCredits)
const articleById = byId(articles)
const locomotionById = byId(behavior.locomotion)

// Alphabetical by English name for stable listings
const speciesSorted = [...species].sort((a, b) => a.names.en.localeCompare(b.names.en))

export function useData() {
  return {
    species: speciesSorted,
    habitats,
    behavior,
    myths,
    articles,
    sources,
    imageCredits,
    getSpecies: (id) => speciesById[id],
    getHabitat: (id) => habitatById[id],
    getSource: (id) => sourceById[id],
    getCredit: (id) => creditById[id],
    getArticle: (id) => articleById[id],
    getLocomotion: (id) => locomotionById[id],
    speciesInHabitat: (hid) => speciesSorted.filter((s) => s.habitats.includes(hid))
  }
}

/** Build responsive image attributes for a bundled photo */
export function imageSet(file) {
  const base = `${import.meta.env.BASE_URL}images/${file}`
  return {
    src: `${base}.webp`,
    srcset: `${base}-sm.webp 720w, ${base}.webp 1290w`
  }
}
