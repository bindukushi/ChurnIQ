import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Sparkles, Users, History, FileDown, MessageSquareText,
  LogOut, Radar, ShieldAlert,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/predict', label: 'Predict', icon: Sparkles },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/history', label: 'Prediction History', icon: History },
  { to: '/assistant', label: 'AI Assistant', icon: MessageSquareText },
  { to: '/reports', label: 'Reports', icon: FileDown },
  { to: '/audit-log', label: 'Audit Log', icon: ShieldAlert, adminOnly: true },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 glass !rounded-none border-r border-white/8 flex flex-col p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-2 py-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Radar size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display font-semibold text-sm leading-tight">ChurnIQ</p>
            <p className="text-[10px] text-white/40 tracking-wide">RETENTION PLATFORM</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin').map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white border border-white/10'
                    : 'text-white/55 hover:text-white hover:bg-white/5'
                )
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/8 pt-3 mt-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-xs font-semibold">
              {user?.full_name?.charAt(0) ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.full_name}</p>
              <p className="text-[10px] text-white/40 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="text-white/40 hover:text-rose-300 transition-colors"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 max-w-[1400px]">
        <Outlet />
      </main>
    </div>
  )
}
