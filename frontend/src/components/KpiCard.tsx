import type { LucideIcon } from 'lucide-react'
import { GlassCard } from './GlassCard'

export function KpiCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent = 'indigo',
}: {
  icon: LucideIcon
  label: string
  value: string
  sublabel?: string
  accent?: 'indigo' | 'violet' | 'cyan' | 'emerald' | 'rose'
}) {
  const accentMap: Record<string, string> = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-300',
    violet: 'from-violet-500/20 to-violet-500/5 text-violet-300',
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-300',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-300',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-300',
  }
  return (
    <GlassCard hover className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-white/45 font-medium">{label}</p>
        <p className="font-display text-2xl font-semibold mt-2 text-white">{value}</p>
        {sublabel && <p className="text-xs text-white/40 mt-1">{sublabel}</p>}
      </div>
      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${accentMap[accent]}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
    </GlassCard>
  )
}
