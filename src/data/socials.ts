import {
  faFacebook,
  faGithub,
  faInstagram,
  faLinkedin,
  faTelegram,
  type IconDefinition,
} from '@fortawesome/free-brands-svg-icons'

export type Social = { name: string; handle: string; url: string; icon: IconDefinition; color: string }

// Brand colors are lifted a little so they read on black.
export const SOCIALS: Social[] = [
  { name: 'GitHub', handle: 'muhammadolim', url: 'https://github.com/muhammadolim', icon: faGithub, color: '#ffffff' },
  { name: 'LinkedIn', handle: 'muhammad-olim', url: 'https://www.linkedin.com/in/muhammad-olim/', icon: faLinkedin, color: '#3d9cff' },
  { name: 'Telegram', handle: '@MuhammadOlim', url: 'https://t.me/MuhammadOlim', icon: faTelegram, color: '#2aabee' },
  { name: 'Instagram', handle: '@muhammad_mwd', url: 'https://www.instagram.com/muhammad_mwd/', icon: faInstagram, color: '#ff4f8b' },
  { name: 'Facebook', handle: 'muhammad.olim.17', url: 'https://www.facebook.com/muhammad.olim.17', icon: faFacebook, color: '#4c8dff' },
]
