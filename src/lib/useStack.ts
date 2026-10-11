import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect, useState } from 'react'

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

// The "stacking deck": every .screen is sticky, so the next one slides up over it.
// Lenis smooths wheel and trackpad scrolling. This hook also
//  - pins tall screens by their bottom, so all of their content can be read
//  - sets --cover (0..1) on a screen while the next one covers it (CSS shrinks and dims it)
//  - settles on the nearest screen edge when scrolling stops between two screens
//  - makes #links scroll to a screen's real position (sticky breaks normal anchors)
//  - returns which screen is in view, and marks screens .is-active once seen
export function useStack() {
  const [active, setActive] = useState('top')

  useEffect(() => {
    const screens = [...document.querySelectorAll<HTMLElement>('.screen')]
    const lenis = new Lenis({ lerp: 0.1, autoRaf: true })
    let starts: number[] = []
    let heights: number[] = []
    let covers: string[] = []
    let vh = innerHeight
    let current = -1

    const measure = () => {
      vh = innerHeight
      heights = screens.map((s) => s.offsetHeight)
      let y = 0
      starts = heights.map((h) => ((y += h), y - h))
      screens.forEach((s, i) => (s.style.top = `${Math.min(0, vh - heights[i])}px`))
      update()
    }

    // Free-scroll range of each screen: from its start until its bottom reaches the viewport bottom.
    const range = (i: number) => [starts[i], starts[i] + Math.max(0, heights[i] - vh)] as const

    const update = () => {
      const y = lenis.scroll
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
        screens[now].classList.add('is-active')
        setActive(screens[now].id)
      }
    }

    const settle = () => {
      if (reduced()) return
      const y = lenis.scroll
      let target = y
      let best = Infinity
      for (let i = 0; i < screens.length; i++) {
        const [a, b] = range(i)
        if (y >= a - 1 && y <= b + 1) return // resting on a screen (or reading a tall one): leave it
        // between two screens: go to whichever screen edge is closest
        for (const edge of [a, b]) {
          if (Math.abs(edge - y) >= best) continue
          best = Math.abs(edge - y)
          target = edge
        }
      }
      lenis.scrollTo(target, { duration: 0.8, easing: easeOut })
    }

    // Settle once Lenis has fully come to rest (wheel, trackpad and touch momentum included).
    // A settle that gets interrupted simply runs again after the next stop, so the page
    // can never be left between two screens.
    let timer = 0
    lenis.on('scroll', () => {
      update()
      clearTimeout(timer)
      timer = window.setTimeout(settle, 120)
    })

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
      const i = a ? screens.findIndex((s) => `#${s.id}` === a.getAttribute('href')) : -1
      if (i < 0) return
      e.preventDefault()
      history.replaceState(null, '', a!.getAttribute('href'))
      lenis.scrollTo(starts[i], { duration: 1.1, easing: easeOut, immediate: reduced() })
    }

    const ro = new ResizeObserver(measure)
    screens.forEach((s) => ro.observe(s))
    addEventListener('resize', measure)
    document.addEventListener('click', onClick)
    measure()

    // opening the page with #code etc. lands on that screen
    const start = screens.findIndex((s) => `#${s.id}` === location.hash)
    if (start > 0) lenis.scrollTo(starts[start], { immediate: true })

    return () => {
      ro.disconnect()
      clearTimeout(timer)
      removeEventListener('resize', measure)
      document.removeEventListener('click', onClick)
      lenis.destroy()
    }
  }, [])

  return active
}
