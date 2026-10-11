const VERSIONS = [
  { label: 'v1 · 2020', url: 'https://muhammadolim.github.io/Portfolio-V1/' },
  { label: 'v2 · 2022', url: 'https://muhammadolim.github.io/Portfolio-V2/' },
]
const YEAR = new Date().getFullYear()

// Sits at the bottom of the last screen.
export function Footer() {
  return (
    <footer className="footer">
      <span>© {YEAR} Muhammad Olim · v3</span>
      <span>
        Earlier versions:{' '}
        {VERSIONS.map((v, i) => (
          <span key={v.label}>
            {i > 0 && ', '}
            <a href={v.url} target="_blank" rel="noopener">{v.label}</a>
          </span>
        ))}
      </span>
    </footer>
  )
}
