import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faTelegram,
  type IconDefinition,
} from '@fortawesome/free-brands-svg-icons'

export type Social = { name: string; handle: string; url: string; icon: IconDefinition; color: string }

// color: the brand's own color (any CSS background), shown behind the icon on hover.
export const SOCIALS: Social[] = [
  { name: 'LinkedIn', handle: 'muhammad-olim', url: 'https://www.linkedin.com/in/muhammad-olim/', icon: faLinkedin, color: '#0a66c2' },
  { name: 'Telegram', handle: '@MuhammadOlim', url: 'https://t.me/MuhammadOlim', icon: faTelegram, color: '#26a5e4' },
  { name: 'Instagram', handle: '@muhammad_mwd', url: 'https://www.instagram.com/muhammad_mwd/', icon: faInstagram, color: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285aeb 90%)' },
  { name: 'Facebook', handle: 'muhammad.olim.17', url: 'https://www.facebook.com/muhammad.olim.17', icon: faFacebook, color: '#0866ff' },
]
