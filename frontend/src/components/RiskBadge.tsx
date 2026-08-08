import clsx from 'clsx'

const STYLES: Record<string, string> = {
  Low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  High: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  Critical: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
}

export function RiskBadge({ level }: { level: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        STYLES[level] ?? STYLES.Medium
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level} risk
    </span>
  )
}
