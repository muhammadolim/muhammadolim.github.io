import { useEffect, useState } from 'react'

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
// mouse or trackpad (not touch): wheel and keys glide between screens at our own pace
const desktop = () => matchMedia('(hover: hover) and (pointer: fine)').matches
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const GLIDE_MS = 900
// a wheel gesture counts as new after this much quiet (trackpad momentum keeps firing)
const GESTURE_GAP_MS = 200

// The "stacking deck": every .screen is sticky, so the next one slides up over it.
// The page pages screen by screen with the browser's own scroll snapping (no scroll
// hijacking): sticky screens make bad snap targets, so each screen gets an invisible snap
// marker (in .snaps) covering its real scroll range. A screen taller than the window gets a
// taller marker, which lets you scroll freely inside it before moving on. Native snapping is
// for touch; on a computer one wheel flick or key press glides to the next screen instead
// (native snapping there is too abrupt). This hook also
//  - pins tall screens by their bottom, so all of their content can be read
//  - sets --cover (0..1) on a screen while the next one covers it (CSS shrinks and dims it)
//  - makes #links scroll to a screen's real position (sticky breaks normal anchors)
//  - returns which screen is in view, and marks screens .is-active once seen
// Heights use the "small viewport" (100svh, and the root's clientHeight), which stays the
// same while a phone's address bar hides and shows, so nothing jumps mid-scroll.
export function useStack() {
  const [active, setActive] = useState('top')

  useEffect(() => {
    let screens = [...document.querySelectorAll<HTMLElement>('.screen')]
    const snaps = document.querySelector<HTMLElement>('.snaps')
    let starts: number[] = []
    let heights: number[] = []
    let covers: string[] = []
    let vh = document.documentElement.clientHeight
    let current = -1

    const measure = () => {
      vh = document.documentElement.clientHeight
      heights = screens.map((s) => s.offsetHeight)
      let y = 0
      starts = heights.map((h) => ((y += h), y - h))
      screens.forEach((s, i) => (s.style.top = `${Math.min(0, vh - heights[i])}px`))
      snaps?.replaceChildren(
        ...starts.map((top, i) => {
          const snap = document.createElement('div')
          snap.style.top = `${top}px`
          snap.style.height = `${Math.max(vh, heights[i])}px`
          return snap
        }),
      )
      update()
    }

    const update = () => {
      const y = scrollY
      let now = 0
      screens.forEach((s, i) => {
        if (starts[i] <= y + vh / 2) now = i
        const next = starts[i + 1]
        const cover = next === undefined || reduced() ? 0 : Math.min(1, Math.max(0, (y + vh - next) / vh))
        const value = cover.toFixed(3)
        if (covers[i] !== value) s.style.setProperty('--cover', (covers[i] = value))
      })
      if (now !== current) {
        current = now
        // every screen up to this one has been seen (also covers screens swapped in later)
        screens.slice(0, now + 1).forEach((s) => s.classList.add('is-active'))
        setActive(screens[now].id)
      }
    }

    // glide: animate the page to a position (instant with reduced motion)
    let glide = 0
    let gliding = false
    const glideTo = (target: number) => {
      cancelAnimationFrame(glide)
      const from = scrollY
      const distance = target - from
      if (reduced() || Math.abs(distance) < 1) return scrollTo({ top: target, behavior: 'instant' })
      const begin = performance.now()
      gliding = true
      const step = (now: number) => {
        const t = Math.min(1, (now - begin) / GLIDE_MS)
        scrollTo({ top: from + distance * easeInOut(t), behavior: 'instant' })
        if (t < 1) glide = requestAnimationFrame(step)
        else gliding = false
      }
      glide = requestAnimationFrame(step)
    }

    // where one step down (+1) or up (-1) goes: through a tall screen a window at a time,
    // otherwise to the next screen's edge
    const stepFrom = (dir: 1 | -1) => {
      const y = scrollY
      const i = Math.max(0, starts.findLastIndex((top) => top <= y + 1))
      const end = starts[i] + Math.max(0, heights[i] - vh)
      const small = vh * 0.25 // a sliver left in this screen isn't worth its own step
      if (dir > 0) return y < end - small ? Math.min(end, y + vh * 0.8) : (starts[i + 1] ?? end)
      if (y > starts[i] + small) return Math.max(starts[i], y - vh * 0.8)
      return i > 0 ? starts[i - 1] + Math.max(0, heights[i - 1] - vh) : 0
    }

    let lastWheel = 0
    const onWheel = (e: WheelEvent) => {
      if (!desktop() || e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return
      e.preventDefault()
      const now = performance.now()
      const fresh = now - lastWheel > GESTURE_GAP_MS
      lastWheel = now
      if (gliding || !fresh || e.deltaY === 0) return
      glideTo(stepFrom(e.deltaY > 0 ? 1 : -1))
    }

    const KEYS: Record<string, 1 | -1> = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 }
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (!desktop() || e.altKey || e.ctrlKey || e.metaKey || target.closest('input, textarea, select, [contenteditable]')) return
      const dir = e.key === ' ' && e.shiftKey ? -1 : KEYS[e.key]
      if (!dir) return
      e.preventDefault()
      if (!gliding) glideTo(stepFrom(dir))
    }

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
      const i = a ? screens.findIndex((s) => `#${s.id}` === a.getAttribute('href')) : -1
      if (i < 0) return
      e.preventDefault()
      history.replaceState(null, '', a!.getAttribute('href'))
      glideTo(starts[i])
    }

    // screens change size with the window width or their content, not with the address bar
    const ro = new ResizeObserver(measure)
    screens.forEach((s) => ro.observe(s))
    // If a section is replaced (e.g. live reload while developing), pick up the new one.
    const mo = new MutationObserver(() => {
      const now = [...document.querySelectorAll<HTMLElement>('.screen')]
      if (now.length === screens.length && now.every((s, i) => s === screens[i])) return
      ro.disconnect()
      screens = now
      covers = []
      current = -1
      screens.forEach((s) => ro.observe(s))
      measure()
    })
    const main = document.querySelector('main')
    if (main) mo.observe(main, { childList: true })
    addEventListener('scroll', update, { passive: true })
    addEventListener('wheel', onWheel, { passive: false })
    addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    measure()

    // opening the page with #code etc. lands on that screen
    const start = screens.findIndex((s) => `#${s.id}` === location.hash)
    if (start > 0) scrollTo({ top: starts[start], behavior: 'instant' })

    return () => {
      ro.disconnect()
      mo.disconnect()
      cancelAnimationFrame(glide)
      removeEventListener('scroll', update)
      removeEventListener('wheel', onWheel)
      removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [])

  return active
}
