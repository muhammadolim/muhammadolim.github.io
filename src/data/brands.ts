import { faGithub, faSpotify, faSteam, type IconDefinition } from '@fortawesome/free-brands-svg-icons'

// Logo and colors of the services that section buttons link to: the button shows the logo and
// takes the brand's own colors on hover (fg is the text color on that background).
export type Brand = { icon: IconDefinition; bg: string; fg: string }

export const BRANDS = {
  github: { icon: faGithub, bg: '#181717', fg: '#fff' },
  steam: { icon: faSteam, bg: '#171a21', fg: '#fff' },
  spotify: { icon: faSpotify, bg: '#1ed760', fg: '#000' }, // black on green, as Spotify does
} satisfies Record<string, Brand>
