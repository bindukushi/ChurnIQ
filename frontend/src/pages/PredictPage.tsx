import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import { predictionApi, type CustomerInput, type PredictionOut } from '../services/api'
import { GlassCard } from '../components/GlassCard'
import { ChurnRing } from '../components/ChurnRing'
import { RiskBadge } from '../components/RiskBadge'

const DEFAULTS: CustomerInput = {
  customer_code: '',
  tenure: 12,
  monthly_charges: 70,
  total_charges: 840,
  num_support_calls: 1,
  contract: 'Month-to-month',
  internet_service: 'Fiber optic',
  tech_support: 'No',
  online_security: 'No',
  payment_method: 'Electronic check',
  paperless_billing: 'Yes',
  senior_citizen: '0',
  partner: 'No',
  dependents: 'No',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

const selectClass =
  'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400/50 transition-colors'

export function PredictPage() {
  const [form, setForm] = useState<CustomerInput>(DEFAULTS)
  const [result, setResult] = useState<PredictionOut | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (patch: Partial<CustomerInput>) => setForm((f) => ({ ...f, ...patch }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const payload = { ...form, customer_code: form.customer_code || `CUST-${Date.now()}` }
      const res = await predictionApi.predict(payload)
      setResult(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Prediction failed. Have you trained a model yet?')
    } finally {
      setLoading(false)
    }
  }

  const maxImpact = result ? Math.max(...result.top_features.map((f) => Math.abs(f.impact)), 0.001) : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Predict churn</h1>
        <p className="text-white/45 text-sm mt-1">Score an individual customer and get an explainable, actionable result</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Form */}
        <GlassCard className="lg:col-span-2">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Customer ID (optional)">
              <input
                value={form.customer_code}
                onChange={(e) => update({ customer_code: e.target.value })}
                placeholder="auto-generated if blank"
                className={selectClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`Tenure (months): ${form.tenure}`}>
                <input
                  type="range" min={0} max={72} value={form.tenure}
                  onChange={(e) => update({ tenure: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </Field>
              <Field label={`Support calls: ${form.num_support_calls}`}>
                <input
                  type="range" min={0} max={15} value={form.num_support_calls}
                  onChange={(e) => update({ num_support_calls: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Monthly charges ($)">
                <input
                  type="number" min={0} step="0.01" value={form.monthly_charges}
                  onChange={(e) => update({ monthly_charges: Number(e.target.value) })}
                  className={selectClass}
                />
              </Field>
              <Field label="Total charges ($)">
                <input
                  type="number" min={0} step="0.01" value={form.total_charges}
                  onChange={(e) => update({ total_charges: Number(e.target.value) })}
                  className={selectClass}
                />
              </Field>
            </div>

            <Field label="Contract">
              <select value={form.contract} onChange={(e) => update({ contract: e.target.value as any })} className={selectClass}>
                <option>Month-to-month</option>
                <option>One year</option>
                <option>Two year</option>
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Internet service">
                <select value={form.internet_service} onChange={(e) => update({ internet_service: e.target.value as any })} className={selectClass}>
                  <option>DSL</option><option>Fiber optic</option><option>No</option>
                </select>
              </Field>
              <Field label="Payment method">
                <select value={form.payment_method} onChange={(e) => update({ payment_method: e.target.value as any })} className={selectClass}>
                  <option>Electronic check</option><option>Mailed check</option><option>Bank transfer</option><option>Credit card</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tech support">
                <select value={form.tech_support} onChange={(e) => update({ tech_support: e.target.value as any })} className={selectClass}>
                  <option>Yes</option><option>No</option>
                </select>
              </Field>
              <Field label="Online security">
                <select value={form.online_security} onChange={(e) => update({ online_security: e.target.value as any })} className={selectClass}>
                  <option>Yes</option><option>No</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Paperless billing">
                <select value={form.paperless_billing} onChange={(e) => update({ paperless_billing: e.target.value as any })} className={selectClass}>
                  <option>Yes</option><option>No</option>
                </select>
              </Field>
              <Field label="Partner">
                <select value={form.partner} onChange={(e) => update({ partner: e.target.value as any })} className={selectClass}>
                  <option>Yes</option><option>No</option>
                </select>
              </Field>
              <Field label="Dependents">
                <select value={form.dependents} onChange={(e) => update({ dependents: e.target.value as any })} className={selectClass}>
                  <option>Yes</option><option>No</option>
                </select>
              </Field>
            </div>

            <Field label="Senior citizen">
              <select value={form.senior_citizen} onChange={(e) => update({ senior_citizen: e.target.value as any })} className={selectClass}>
                <option value="0">No</option><option value="1">Yes</option>
              </select>
            </Field>

            {error && (
              <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 transition-opacity rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {loading ? 'Scoring customer…' : 'Predict churn risk'}
            </button>
          </form>
        </GlassCard>

        {/* Result */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <GlassCard className="flex flex-col md:flex-row items-center gap-6">
                  <ChurnRing probability={result.probability} riskLevel={result.risk_level} />
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <h2 className="font-display text-xl font-semibold">{result.prediction}</h2>
                      <RiskBadge level={result.risk_level} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white/5 rounded-xl px-3 py-2">
                        <p className="text-white/40 text-xs">Confidence</p>
                        <p className="font-mono font-medium">{Math.round(result.confidence * 100)}%</p>
                      </div>
                      <div className="bg-white/5 rounded-xl px-3 py-2">
                        <p className="text-white/40 text-xs">Model used</p>
                        <p className="font-medium text-xs mt-1">{result.model_used}</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="font-display font-semibold text-sm mb-4">Feature impact (SHAP)</h3>
                  <div className="space-y-2.5">
                    {result.top_features.map((f) => (
                      <div key={f.feature} className="flex items-center gap-3 text-xs">
                        <span className="w-40 shrink-0 text-white/55 truncate font-mono">{f.feature.replace(/^(num|cat)__/, '')}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${f.impact >= 0 ? 'bg-gradient-to-r from-rose-500 to-orange-400' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'}`}
                            style={{ width: `${(Math.abs(f.impact) / maxImpact) * 100}%` }}
                          />
                        </div>
                        <span className={`w-14 text-right font-mono ${f.impact >= 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                          {f.impact >= 0 ? '+' : ''}{f.impact.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="font-display font-semibold text-sm mb-4">AI retention recommendations</h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-white/75">
                        <span className="text-cyan-300 mt-0.5">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex items-center justify-center"
              >
                <GlassCard className="w-full text-center py-20">
                  <Sparkles size={28} className="mx-auto text-white/25 mb-3" />
                  <p className="text-white/50 text-sm">Fill in the customer details and click "Predict churn risk"</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
