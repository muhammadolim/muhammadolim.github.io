import type { IconDefinition } from '@fortawesome/free-brands-svg-icons'

export function Icon({ icon, size = 20 }: { icon: IconDefinition; size?: number }) {
  const [w, h, , , path] = icon.icon
  return (
    <svg className="icon" viewBox={`0 0 ${w} ${h}`} width={size} height={size} aria-hidden="true" fill="currentColor">
      <path d={Array.isArray(path) ? path.join(' ') : path} />
    </svg>
  )
}
