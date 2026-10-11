// Form definitions for every editable collection. `options` may be a function of the loaded store.

const opt = (...vals) => vals.map((v) => ({ value: v, label: v }))
const speciesOpts = (s) => s.species.map((x) => ({ value: x.id, label: `${x.names.en} (${x.scientificName})` }))
const sourceOpts = (s) => s.sources.map((x) => ({ value: x.id, label: x.title }))
const habitatOpts = (s) => s.habitats.map((x) => ({ value: x.id, label: x.name.en }))
const moveOpts = (s) => [
  ...s.behavior.locomotion.map((m) => ({ value: m.id, label: m.name.en })),
  ...Object.entries(s.behavior.extraLocomotion).map(([k, v]) => ({ value: k, label: v.en }))
]
const imageOpts = (s) => [{ value: '', label: '(none)' }, ...s.images.filter((f) => f.endsWith('.webp') && !f.endsWith('-sm.webp')).map((f) => ({ value: f.replace(/\.webp$/, ''), label: f }))]
const nameStatus = opt('verified', 'provisional', 'unavailable')

export const speciesSchema = [
  { group: 'Identity' },
  { key: 'names.en', label: 'English name', type: 'text', required: true },
  { key: 'scientificName', label: 'Scientific name', type: 'text', required: true, hint: 'Check against The Reptile Database' },
  { key: 'family', label: 'Family', type: 'text' },
  { key: 'group', label: 'Group', type: 'select', options: opt('elapid', 'viper', 'colubrid', 'python', 'blind', 'sea') },
  { key: 'names.si.text', label: 'Sinhala name', type: 'text', lang: 'si' },
  { key: 'names.si.status', label: 'Sinhala name status', type: 'select', options: nameStatus },
  { key: 'names.ta.text', label: 'Tamil name', type: 'text', lang: 'ta' },
  { key: 'names.ta.status', label: 'Tamil name status', type: 'select', options: nameStatus },
  { key: 'status', label: 'Status', type: 'select', options: opt('native', 'endemic') },
  { key: 'medical', label: 'Medical importance', type: 'select', options: opt('high', 'moderate', 'low', 'none'), hint: 'Use expert-reviewed terminology (SLMA)' },
  { key: 'activity', label: 'Activity', type: 'select', options: opt('diurnal', 'nocturnal', 'crepuscular', 'both') },
  { key: 'size', label: 'Size', type: 'text' },

  { group: 'Where and how' },
  { key: 'habitats', label: 'Habitats', type: 'multi', options: habitatOpts },
  { key: 'locomotion', label: 'Movement', type: 'multi', options: moveOpts },

  { group: 'Identification guide traits', hint: 'Used by the question-based matcher' },
  { key: 'traits.build', label: 'Body shape', type: 'select', options: opt('tiny', 'small', 'slender', 'medium', 'stout') },
  { key: 'traits.colour', label: 'Colours', type: 'multi', options: opt('green', 'brown', 'dark', 'banded') },
  { key: 'traits.pattern', label: 'Patterns', type: 'multi', options: opt('plain', 'bands', 'chain', 'checkered', 'blotches', 'zigzag') },
  { key: 'traits.head', label: 'Head shape', type: 'select', options: opt('triangular', 'pointed', 'rounded') },
  { key: 'traits.setting', label: 'Where seen', type: 'multi', options: opt('tree', 'ground', 'water', 'buildings', 'coast') },

  { group: 'Illustration (used when there is no photo)' },
  { key: 'plate.base', label: 'Body colour', type: 'color' },
  { key: 'plate.mark', label: 'Marking colour', type: 'color' },
  { key: 'plate.pattern', label: 'Pattern', type: 'select', options: opt('plain', 'thin-bands', 'wide-bands', 'rear-bars', 'chain', 'check', 'blotch', 'zigzag') },
  { key: 'plate.hood', label: 'Show hood', type: 'bool' },

  { group: 'Profile text (English)' },
  { key: 'en.summary', label: 'Summary', type: 'textarea', rows: 2 },
  { key: 'en.appearance', label: 'Appearance', type: 'textarea' },
  { key: 'en.variation', label: 'Documented variation', type: 'textarea' },
  { key: 'en.ecology', label: 'Ecology and diet', type: 'textarea' },
  { key: 'en.behaviour', label: 'Behaviour', type: 'textarea' },
  { key: 'en.defence', label: 'Defensive behaviour', type: 'textarea' },
  { key: 'en.distribution', label: 'Distribution in Sri Lanka', type: 'textarea' },
  { key: 'en.limitations', label: 'Identification limitations', type: 'textarea' },
  { key: 'en.folklore', label: 'Folklore and curiosities (leave empty if none documented)', type: 'textarea' },
  { key: 'en.fact', label: 'Did you know? (optional)', type: 'textarea', rows: 2 },

  { group: 'Translated summaries' },
  { key: 'si.summary', label: 'Sinhala summary', type: 'textarea', rows: 2, lang: 'si' },
  { key: 'ta.summary', label: 'Tamil summary', type: 'textarea', rows: 2, lang: 'ta' },

  { group: 'Links and review' },
  { key: 'similar', label: 'Similar-looking species', type: 'multi', options: speciesOpts },
  { key: 'references', label: 'References', type: 'multi', options: sourceOpts },
  { key: 'conservation.status', label: 'Conservation status (with source and year)', type: 'text' },
  { key: 'conservation.note', label: 'Conservation note', type: 'text' },
  { key: 'lastReviewed', label: 'Last reviewed', type: 'date' }
]

export function newSpecies(id) {
  return {
    id, scientificName: '', family: '', group: 'colubrid',
    names: { en: '', si: { text: null, status: 'unavailable' }, ta: { text: null, status: 'unavailable' } },
    status: 'native', medical: 'none', habitats: [], activity: 'nocturnal', locomotion: ['lateral-undulation'], size: '',
    traits: { build: 'medium', colour: ['brown'], pattern: ['plain'], head: 'rounded', setting: ['ground'] },
    plate: { base: '#8a7444', mark: '#3e331f', pattern: 'plain' },
    images: [],
    en: { summary: '', appearance: '', variation: '', ecology: '', behaviour: '', defence: '', distribution: '', limitations: '', folklore: null },
    si: { summary: '' }, ta: { summary: '' },
    similar: [], conservation: { status: null, note: 'Assessment not yet recorded in this dataset.' },
    references: [], lastReviewed: new Date().toISOString().slice(0, 10)
  }
}

// Generic collections ------------------------------------------------------
export const collections = {
  folklore: {
    file: 'folklore', label: 'Folklore & stories', titleOf: (x) => x.title?.en || x.id,
    blank: (id) => ({ id, kind: 'legend', tradition: '', species: [], title: { en: '', si: '', ta: '' }, story: '', note: '', refs: [] }),
    fields: [
      { key: 'kind', label: 'Type', type: 'select', options: opt('legend', 'tradition', 'belief') },
      { key: 'tradition', label: 'Tradition / where it comes from', type: 'text' },
      { key: 'title', label: 'Title', type: 'i18n' },
      { key: 'story', label: 'Story (English)', type: 'textarea', rows: 6 },
      { key: 'note', label: 'Note (how to read it, e.g. "a legend, not a description of real behaviour")', type: 'textarea', rows: 2 },
      { key: 'species', label: 'Related species', type: 'multi', options: speciesOpts },
      { key: 'refs', label: 'Sources (title + link)', type: 'links' }
    ]
  },
  myths: {
    file: 'myths', label: 'Myths & facts', titleOf: (x) => x.claim?.en || x.id,
    blank: (id) => ({ id, kind: 'unsupported', species: [], claim: { en: '', si: '', ta: '' }, context: '', evidence: '', explanation: '', refs: [] }),
    fields: [
      { key: 'kind', label: 'Type', type: 'select', options: opt('folklore', 'cultural', 'unsupported') },
      { key: 'claim', label: 'The claim', type: 'i18n' },
      { key: 'context', label: 'Where it comes from', type: 'textarea' },
      { key: 'evidence', label: 'What the evidence says', type: 'textarea' },
      { key: 'explanation', label: 'In plain words', type: 'textarea' },
      { key: 'species', label: 'Related species', type: 'multi', options: speciesOpts },
      { key: 'refs', label: 'References', type: 'multi', options: sourceOpts }
    ]
  },
  articles: {
    file: 'articles', label: 'Articles', titleOf: (x) => x.title?.en || x.id,
    blank: (id) => ({ id, category: '', image: '', title: { en: '', si: '', ta: '' }, lede: '', body: [''], refs: [] }),
    fields: [
      { key: 'title', label: 'Title', type: 'i18n' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'image', label: 'Cover image', type: 'select', options: imageOpts },
      { key: 'lede', label: 'Intro', type: 'textarea', rows: 2 },
      { key: 'body', label: 'Paragraphs', type: 'paragraphs' },
      { key: 'refs', label: 'References', type: 'multi', options: sourceOpts }
    ]
  },
  habitats: {
    file: 'habitats', label: 'Habitats', titleOf: (x) => x.name?.en || x.id,
    blank: (id) => ({ id, zone: 'mixed', name: { en: '', si: '', ta: '' }, image: '', en: '', si: '', ta: '' }),
    fields: [
      { key: 'name', label: 'Name', type: 'i18n' },
      { key: 'zone', label: 'Map zone', type: 'select', options: opt('wet', 'dry', 'mixed', 'coast') },
      { key: 'image', label: 'Image', type: 'select', options: imageOpts },
      { key: 'en', label: 'Description (English)', type: 'textarea' },
      { key: 'si', label: 'Description (Sinhala)', type: 'textarea', lang: 'si' },
      { key: 'ta', label: 'Description (Tamil)', type: 'textarea', lang: 'ta' }
    ]
  },
  sources: {
    file: 'sources', label: 'Sources', titleOf: (x) => x.title || x.id,
    blank: (id) => ({ id, title: '', publisher: '', url: '', accessed: new Date().toISOString().slice(0, 10), use: '' }),
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'publisher', label: 'Publisher / author', type: 'text' },
      { key: 'url', label: 'Link', type: 'text' },
      { key: 'accessed', label: 'Accessed', type: 'date' },
      { key: 'use', label: 'What it supports', type: 'text' }
    ]
  }
}
