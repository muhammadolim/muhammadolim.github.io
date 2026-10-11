import steam from './steam.json'

// The three screens after the intro, in order. Each has its own background color.
export const SECTIONS = [
  { id: 'collection', title: 'Collection', blurb: 'Early creative work', color: '#ffd84d' },
  { id: 'code', title: 'Code', blurb: 'Mostly private work', color: '#00d87e' },
  ...(steam ? [{ id: 'play', title: 'Play', blurb: 'Hours on Steam', color: '#ff7b5c' }] : []),
]

export const numberOf = (id: string) => String(SECTIONS.findIndex((s) => s.id === id) + 1).padStart(2, '0')
