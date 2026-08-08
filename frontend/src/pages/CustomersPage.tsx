import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { customerApi } from '../services/api'
import { GlassCard } from '../components/GlassCard'

interface CustomerRow {
  id: string
  customer_code: string
  tenure: number
  monthly_charges: number
  total_charges: number
  contract: string
  internet_service: string
  num_support_calls: number
}

export function CustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const load = async () => {
    const res = await customerApi.list({ search: search || undefined, page, page_size: pageSize })
    setRows(res.data.items)
    setTotal(res.data.total)
  }

  useEffect(() => { load() }, [page])
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 300)
    return () => clearTimeout(t)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Customers</h1>
          <p className="text-white/45 text-sm mt-1">{total} customer{total === 1 ? '' : 's'} scored on this platform</p>
        </div>
        <div className="relative w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer ID…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-indigo-400/50 transition-colors"
          />
        </div>
      </div>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-white/40 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Customer ID</th>
                <th className="px-5 py-3 font-medium">Tenure</th>
                <th className="px-5 py-3 font-medium">Monthly Charges</th>
                <th className="px-5 py-3 font-medium">Contract</th>
                <th className="px-5 py-3 font-medium">Internet</th>
                <th className="px-5 py-3 font-medium">Support Calls</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs">{c.customer_code}</td>
                  <td className="px-5 py-3">{c.tenure} mo</td>
                  <td className="px-5 py-3 font-mono">${c.monthly_charges.toFixed(2)}</td>
                  <td className="px-5 py-3 text-white/60">{c.contract}</td>
                  <td className="px-5 py-3 text-white/60">{c.internet_service}</td>
                  <td className="px-5 py-3">{c.num_support_calls}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="text-center text-white/35 text-sm py-14">No customers found.</p>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/8 text-xs text-white/45">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-white/5 disabled:opacity-40">Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-white/5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
