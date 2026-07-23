import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Wallet, ListTodo, FileBarChart, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/finances', label: 'Keuangan', icon: Wallet },
  { to: '/todos', label: 'Tugas', icon: ListTodo },
  { to: '/laporan', label: 'Laporan', icon: FileBarChart },
  { to: '/pengaturan', label: 'Pengaturan', icon: SettingsIcon },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen lg:flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="app-bg">
        <div className="app-orb app-orb-1" />
        <div className="app-orb app-orb-2" />
        <div className="app-grid" />
      </div>

      {/* Sidebar — desktop only, collapses to icon rail and expands on hover */}
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 glass-panel border-r p-4 overflow-hidden transition-[width] duration-300 ease-out ${
          sidebarExpanded ? 'lg:w-64' : 'lg:w-20'
        }`}
      >
        <div className={`flex items-center gap-3 mb-8 ${sidebarExpanded ? '' : 'justify-center'}`}>
          <div className="gradient-logo w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h1
            className={`font-bold text-hi text-lg tracking-tight whitespace-nowrap transition-all duration-200 ${
              sidebarExpanded ? 'opacity-100 max-w-40' : 'opacity-0 max-w-0'
            }`}
          >
            SakuTask
          </h1>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-item flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  sidebarExpanded ? 'gap-3 justify-start' : 'justify-center'
                } ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span
                className={`whitespace-nowrap transition-all duration-200 ${
                  sidebarExpanded ? 'opacity-100 max-w-40' : 'opacity-0 max-w-0'
                }`}
              >
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-4">
          <p
            className={`text-sm text-mid mb-2 whitespace-nowrap transition-all duration-200 ${
              sidebarExpanded ? 'opacity-100 max-w-40' : 'opacity-0 max-w-0'
            }`}
          >
            {user.name}
          </p>
          <button
            onClick={logout}
            className={`flex items-center text-sm text-muted hover:text-red-400 transition-colors w-full ${
              sidebarExpanded ? 'gap-2 justify-start' : 'justify-center'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span
              className={`whitespace-nowrap transition-all duration-200 ${
                sidebarExpanded ? 'opacity-100 max-w-40' : 'opacity-0 max-w-0'
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      <div className="flex-1 pb-20 lg:pb-0 lg:pl-20 relative z-10">
        {/* Header — mobile only */}
        <header className="sticky top-0 glass-panel border-b px-4 py-3 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className="gradient-logo w-7 h-7 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-semibold text-hi">SakuTask</h1>
          </div>
          <button onClick={logout} className="text-muted hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="max-w-md mx-auto px-4 py-4 lg:max-w-4xl lg:px-8 lg:py-8">
          <Outlet />
        </main>

        {/* Bottom nav — mobile only */}
        <nav className="fixed bottom-0 inset-x-0 glass-panel border-t lg:hidden">
          <div className="max-w-md mx-auto grid grid-cols-5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `nav-item flex flex-col items-center gap-1 py-2.5 text-xs ${
                    isActive ? 'text-white' : ''
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-5 h-5" style={isActive ? { color: 'var(--color-primary-light)' } : undefined} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
