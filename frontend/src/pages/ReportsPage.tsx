import { FileText, FileSpreadsheet, FileDown } from 'lucide-react'
import { reportUrl, API_BASE } from '../services/api'
import { GlassCard } from '../components/GlassCard'

const REPORTS = [
  { format: 'csv' as const, title: 'CSV Export', desc: 'Raw prediction records for spreadsheets or BI tools', icon: FileText },
  { format: 'excel' as const, title: 'Excel Workbook', desc: 'Formatted .xlsx with auto-sized columns', icon: FileSpreadsheet },
  { format: 'pdf' as const, title: 'PDF Report', desc: 'Shareable summary with KPIs and prediction table', icon: FileDown },
]

export function ReportsPage() {
  const download = (format: 'csv' | 'excel' | 'pdf') => {
    const token = localStorage.getItem('churn_token')
    // Use fetch to attach the auth header, then trigger a browser download.
    fetch(reportUrl(format), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `prediction_report.${format === 'excel' ? 'xlsx' : format}`
        a.click()
        URL.revokeObjectURL(url)
      })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="text-white/45 text-sm mt-1">Export prediction data and analytics for offline sharing</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {REPORTS.map(({ format, title, desc, icon: Icon }) => (
          <GlassCard key={format} hover className="flex flex-col gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 flex items-center justify-center text-indigo-300">
              <Icon size={20} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-sm">{title}</h3>
              <p className="text-white/45 text-xs mt-1">{desc}</p>
            </div>
            <button
              onClick={() => download(format)}
              className="mt-auto text-sm bg-white/5 hover:bg-white/10 transition-colors rounded-xl py-2 font-medium"
            >
              Download
            </button>
          </GlassCard>
        ))}
      </div>
      <p className="text-xs text-white/30">API base: <span className="font-mono">{API_BASE}</span></p>
    </div>
  )
}
