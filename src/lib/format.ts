// Number formats shared by the sections and stickers.
export const fmt = (n: number) => n.toLocaleString('en-US')
export const compact = (n: number) => Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
