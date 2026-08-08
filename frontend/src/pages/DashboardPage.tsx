import { useEffect, useState } from 'react'
import {
  Users, UserMinus, ShieldCheck, DollarSign, Clock, Gauge, Target, RefreshCw,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Legend,
} from 'recharts'
import { dashboardApi, trainApi, type DashboardKPIs } from '../services/api'
import { KpiCard } from '../components/KpiCard'
import { GlassCard } from '../components/GlassCard'

const RISK_COLORS: Record<string, string> = {
  Low: '#10B981', Medium: '#F59E0B', High: '#FB923C', Critical: '#F43F5E',
}

export function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [riskDist, setRiskDist] = useState<{ name: string; value: number }[]>([])
  const [byContract, setByContract] = useState<any[]>([])
  const [training, setTraining] = useState(false)
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true)
    try {
      const [k, r, c] = await Promise.all([
        dashboardApi.kpis(),
        dashboardApi.riskDistribution(),
        dashboardApi.churnByContract(),
      ])
      setKpis(k.data)
      setRiskDist(Object.entries(r.data).map(([name, value]) => ({ name, value: value as number })))
      setByContract(c.data)
    } catch {
      // handled inline via empty state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleTrain = async () => {
    setTraining(true)
    try {
      await trainApi.train()
      await load()
    } finally {
      setTraining(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Overview</h1>
          <p className="text-white/45 text-sm mt-1">Real-time churn risk across your customer base</p>
        </div>
        <button
          onClick={handleTrain}
          disabled={training}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 transition-opacity rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          <RefreshCw size={15} className={training ? 'animate-spin' : ''} />
          {training ? 'Training models…' : 'Retrain models'}
        </button>
      </div>

      {!loading && kpis && kpis.total_customers === 0 && (
        <GlassCard className="text-center py-10">
          <p className="text-white/70 font-medium">No data yet</p>
          <p className="text-white/40 text-sm mt-1">
            Head to <span className="text-indigo-300">Predict</span> to score your first customer, or click{' '}
            <span className="text-indigo-300">Retrain models</span> to initialize the ML pipeline.
          </p>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total Customers" value={kpis ? String(kpis.total_customers) : '—'} accent="indigo" />
        <KpiCard icon={UserMinus} label="Total Churn" value={kpis ? String(kpis.total_churn) : '—'} accent="rose" />
        <KpiCard icon={ShieldCheck} label="Retention Rate" value={kpis ? `${kpis.retention_rate}%` : '—'} accent="emerald" />
        <KpiCard icon={DollarSign} label="Monthly Revenue" value={kpis ? `$${kpis.monthly_revenue.toLocaleString()}` : '—'} accent="cyan" />
        <KpiCard icon={Clock} label="Avg. Tenure" value={kpis ? `${kpis.average_tenure} mo` : '—'} accent="violet" />
        <KpiCard icon={Gauge} label="Avg. Monthly Charges" value={kpis ? `$${kpis.average_charges}` : '—'} accent="indigo" />
        <KpiCard icon={Target} label="Model Accuracy" value={kpis ? `${kpis.prediction_accuracy}%` : '—'} sublabel="best model, held-out test set" accent="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard>
          <h3 className="font-display font-semibold text-sm mb-4">Risk distribution</h3>
          {riskDist.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={riskDist} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                  {riskDist.map((d) => (
                    <Cell key={d.name} fill={RISK_COLORS[d.name] ?? '#6366F1'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#141B31', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/35 text-sm py-16 text-center">No predictions recorded yet.</p>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-display font-semibold text-sm mb-4">Churn by contract type</h3>
          {byContract.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byContract}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="contract" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: '#141B31', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="total" name="Total" fill="#6366F1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="churned" name="Churned" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/35 text-sm py-16 text-center">No predictions recorded yet.</p>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
