import { reactive, ref, computed, onBeforeUnmount } from 'vue'
import game from '../data/game.json'

export const COLORS = ['#b5482f', '#2f6f9f', '#c9971c', '#6b3fa0']
export const snakeAt = Object.fromEntries(game.snakes.map((s) => [s.head, s]))
export const ladderAt = Object.fromEntries(game.ladders.map((l) => [l.from, l]))

const SAVE_KEY = 'cs-snl-game'
const BOOK_KEY = 'cs-snl-notebook'
const CPU_ACCURACY = 0.65

function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback } catch { return fallback }
}
function store(key, value) {
  try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage blocked */ }
}

/** Position of a square's centre on a 100×100 board (square 1 bottom-left, rows alternate direction) */
export function cellXY(n) {
  const row = Math.floor((n - 1) / 10)
  let col = (n - 1) % 10
  if (row % 2 === 1) col = 9 - col
  return { x: col * 10 + 5, y: (9 - row) * 10 + 5 }
}

/** Where a correct answer lets you stop: half-way down the snake */
export const softLanding = (s) => s.head - Math.ceil((s.head - s.tail) / 2)

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export function useSnakesLadders({ reduced }) {
  const state = reactive({
    phase: 'setup', // setup | playing | card | won
    players: [],
    turn: 0,
    die: 1,
    rolling: false,
    moving: false,
    sliding: false,
    locked: false, // true from a roll until the turn passes, a card opens or someone wins
    card: null, // { type, id, player, order, picked, correct }
    message: '',
    winner: null,
    history: [] // cards seen this game: { type, id, correct? }
  })
  const notebook = ref({ snakes: [], ladders: [] })
  const saved = ref(null)
  let alive = true
  onBeforeUnmount(() => { alive = false })

  const current = computed(() => state.players[state.turn])
  const busy = computed(() => state.locked || state.rolling || state.moving || state.sliding || state.phase !== 'playing')

  function restore() {
    notebook.value = load(BOOK_KEY, { snakes: [], ladders: [] })
    const g = load(SAVE_KEY, null)
    saved.value = g && Array.isArray(g.players) && g.players.length ? g : null
  }

  function persist() {
    if (state.phase === 'won' || state.phase === 'setup') return store(SAVE_KEY, null)
    store(SAVE_KEY, { players: state.players, turn: state.turn, history: state.history })
  }

  function addToNotebook(kind, id) {
    const list = notebook.value[kind]
    if (!list.includes(id)) { list.push(id); store(BOOK_KEY, notebook.value) }
  }
  function clearNotebook() { notebook.value = { snakes: [], ladders: [] }; store(BOOK_KEY, null) }

  function start(players) {
    state.players = players.map((p, i) => ({ ...p, color: COLORS[i], pos: 0, asked: 0, correct: 0 }))
    state.turn = 0
    state.history = []
    state.winner = null
    state.card = null
    state.message = ''
    state.locked = false
    state.phase = 'playing'
    persist()
    maybeComputer()
  }

  function resume() {
    const g = saved.value
    if (!g) return
    state.players = g.players
    state.turn = g.turn % g.players.length
    state.history = g.history || []
    state.winner = null
    state.card = null
    state.message = ''
    state.locked = false
    state.phase = 'playing'
    saved.value = null
    maybeComputer()
  }

  function quit() {
    state.locked = false
    state.phase = 'setup'
    state.card = null
    store(SAVE_KEY, null)
    saved.value = null
  }

  async function maybeComputer() {
    if (state.phase !== 'playing' || current.value?.kind !== 'computer') return
    await wait(reduced ? 300 : 900)
    if (alive && state.phase === 'playing' && current.value?.kind === 'computer') roll()
  }

  async function roll() {
    if (busy.value) return
    const p = current.value
    state.locked = true
    state.rolling = true
    const value = 1 + Math.floor(Math.random() * 6)
    if (!reduced) {
      for (let i = 0; i < 8; i++) { state.die = 1 + Math.floor(Math.random() * 6); await wait(60) }
    }
    state.die = value
    state.rolling = false
    if (!alive) return

    const target = p.pos + value
    if (target > 100) {
      state.message = { key: 'game.exact', vars: { name: p.name, n: value, need: 100 - p.pos } }
      await wait(reduced ? 200 : 700)
      return nextTurn()
    }

    state.moving = true
    if (reduced) p.pos = target
    else for (let s = p.pos + 1; s <= target; s++) { p.pos = s; await wait(170) }
    state.moving = false
    state.message = { key: 'game.rolled', vars: { name: p.name, n: value, to: target } }
    if (!alive) return

    if (target === 100) return win(p)
    const snake = snakeAt[target]
    const ladder = ladderAt[target]
    if (snake || ladder) {
      await wait(reduced ? 0 : 250)
      openCard(snake ? 'snake' : 'ladder', (snake || ladder).id, p)
      return
    }
    nextTurn()
  }

  function shuffle(n) {
    const a = [...Array(n).keys()]
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    return a
  }

  function openCard(type, id, player) {
    const data = type === 'snake' ? game.snakes.find((s) => s.id === id) : game.ladders.find((l) => l.id === id)
    state.locked = false
    state.card = { type, id, data, player: state.players.indexOf(player), order: type === 'snake' ? shuffle(data.options.length) : [], picked: null, correct: null }
    state.phase = 'card'
    addToNotebook(type === 'snake' ? 'snakes' : 'ladders', id)
    if (type === 'snake' && player.kind === 'computer') {
      setTimeout(() => {
        if (!alive || state.card?.id !== id) return
        const right = Math.random() < CPU_ACCURACY
        const wrong = data.options.map((_, i) => i).filter((i) => i !== data.answer)
        answer(right ? data.answer : wrong[Math.floor(Math.random() * wrong.length)])
      }, reduced ? 400 : 1400)
    }
  }

  function answer(i) {
    const c = state.card
    if (!c || c.type !== 'snake' || c.picked !== null) return
    c.picked = i
    c.correct = i === c.data.answer
    const p = state.players[c.player]
    p.asked++
    if (c.correct) p.correct++
  }

  /** Where the current card sends the player */
  const cardTarget = computed(() => {
    const c = state.card
    if (!c) return null
    if (c.type === 'ladder') return c.data.to
    if (c.picked === null) return null
    return c.correct ? softLanding(c.data) : c.data.tail
  })

  async function resolveCard() {
    const c = state.card
    if (!c || (c.type === 'snake' && c.picked === null)) return
    state.locked = true
    const p = state.players[c.player]
    const to = cardTarget.value
    state.history.push({ type: c.type, id: c.id, correct: c.type === 'snake' ? c.correct : undefined })
    state.card = null
    state.phase = 'playing'
    state.sliding = true
    p.pos = to
    await wait(reduced ? 0 : 850)
    state.sliding = false
    state.message = { key: c.type === 'snake' ? 'game.slid' : 'game.climbed', vars: { name: p.name, to } }
    nextTurn()
  }

  function win(p) {
    state.locked = false
    state.winner = state.players.indexOf(p)
    state.phase = 'won'
    persist()
  }

  function nextTurn() {
    if (!alive || state.phase !== 'playing') return
    state.turn = (state.turn + 1) % state.players.length
    state.locked = false
    persist()
    maybeComputer()
  }

  return { state, notebook, saved, current, busy, cardTarget, restore, start, resume, quit, roll, answer, resolveCard, clearNotebook }
}

export { game }
