import { useEffect, useState } from 'react'
import { predictionApi } from '../services/api'
import { GlassCard } from '../components/GlassCard'
import { RiskBadge } from '../components/RiskBadge'

interface HistoryRow {
  id: string
  customer_code?: string
  prediction: string
  probability: number
  risk_level: string
  model_used: string
  created_at: string
}

export function HistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    predictionApi.history(100).then((res) => setRows(res.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Prediction history</h1>
        <p className="text-white/45 text-sm mt-1">Every churn prediction made on this platform</p>
      </div>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-white/40 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Prediction</th>
                <th className="px-5 py-3 font-medium">Probability</th>
                <th className="px-5 py-3 font-medium">Risk</th>
                <th className="px-5 py-3 font-medium">Model</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-white/70">{r.customer_code ?? '—'}</td>
                  <td className="px-5 py-3">{r.prediction}</td>
                  <td className="px-5 py-3 font-mono">{Math.round(r.probability * 100)}%</td>
                  <td className="px-5 py-3"><RiskBadge level={r.risk_level} /></td>
                  <td className="px-5 py-3 text-white/50 text-xs">{r.model_used}</td>
                  <td className="px-5 py-3 text-white/40 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && rows.length === 0 && (
            <p className="text-center text-white/35 text-sm py-14">No predictions yet — head to the Predict page to get started.</p>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
