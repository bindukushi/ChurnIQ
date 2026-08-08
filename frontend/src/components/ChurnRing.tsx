import { motion } from 'framer-motion'

const RISK_COLORS: Record<string, string> = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#FB923C',
  Critical: '#F43F5E',
}

interface ChurnRingProps {
  probability: number // 0..1
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  size?: number
  label?: string
}

export function ChurnRing({ probability, riskLevel, size = 220, label }: ChurnRingProps) {
  const stroke = size * 0.07
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(1, probability))
  const dash = circumference * pct
  const color = RISK_COLORS[riskLevel] ?? RISK_COLORS.Medium
  const gradientId = `ring-gradient-${riskLevel}`

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* glow halo */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-40"
        style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
      />
      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="55%" stopColor="#A855F7" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono font-semibold" style={{ fontSize: size * 0.19, color }}>
          {Math.round(pct * 100)}%
        </span>
        <span className="text-xs uppercase tracking-wider text-white/50 mt-1">
          {label ?? 'churn probability'}
        </span>
      </div>
    </div>
  )
}
