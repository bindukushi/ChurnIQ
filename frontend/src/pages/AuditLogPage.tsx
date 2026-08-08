import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { GlassCard } from '../components/GlassCard'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert } from 'lucide-react'

interface AuditRow {
  id: string
  user_email: string
  action: string
  details: string | null
  created_at: string
}

export function AuditLogPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<AuditRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role !== 'admin') return
    api.get('/api/audit-logs').then((res) => setRows(res.data)).catch(() => setError('Failed to load audit logs.'))
  }, [user])

  if (user?.role !== 'admin') {
    return (
      <GlassCard className="text-center py-16">
        <ShieldAlert className="mx-auto mb-3 text-white/30" size={28} />
        <p className="text-white/60 text-sm">Audit logs are only visible to admin accounts.</p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Audit log</h1>
        <p className="text-white/45 text-sm mt-1">Login, registration, and prediction activity across the platform</p>
      </div>

      <GlassCard className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-white/40 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">Details</th>
              <th className="px-5 py-3 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="px-5 py-3 text-white/70">{r.user_email}</td>
                <td className="px-5 py-3 capitalize">{r.action}</td>
                <td className="px-5 py-3 text-white/45 text-xs">{r.details ?? '—'}</td>
                <td className="px-5 py-3 text-white/40 text-xs">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && <p className="text-center text-rose-300 text-sm py-8">{error}</p>}
        {!error && rows.length === 0 && <p className="text-center text-white/35 text-sm py-14">No activity recorded yet.</p>}
      </GlassCard>
    </div>
  )
}
