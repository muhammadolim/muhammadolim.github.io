import spotify from './spotify.json'

// The three screens after the intro, in order. Each has its own background color.
export const SECTIONS = [
  { id: 'code', title: 'Code', blurb: 'Mostly private work', color: '#00d87e' },
  ...(spotify?.top.length ? [{ id: 'play', title: 'Music', blurb: 'What I listen to', color: '#ff7b5c' }] : []),
  { id: 'collection', title: 'Collection', blurb: 'Early creative work', color: '#ffd84d' },
]

export const numberOf = (id: string) => String(SECTIONS.findIndex((s) => s.id === id) + 1).padStart(2, '0')
