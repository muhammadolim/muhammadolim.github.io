// The filter buttons from v2: gray blocks, the active one gets a white border.
export type Tab<K extends string | number> = { key: K; label: string; count?: number }

export function Tabs<K extends string | number>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: Tab<K>[]
  active: K
  onChange: (key: K) => void
  label: string
}) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          className="tab"
          aria-pressed={t.key === active}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          {t.count !== undefined && <span className="tab-count">{t.count.toLocaleString('en-US')}</span>}
        </button>
      ))}
    </div>
  )
}
