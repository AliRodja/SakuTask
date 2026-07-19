import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Wallet, ListTodo, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/finances', label: 'Keuangan', icon: Wallet },
  { to: '/todos', label: 'Tugas', icon: ListTodo },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-r border-gray-200 p-4">
        <h1 className="font-semibold text-gray-900 text-lg mb-8">SakuTask</h1>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500 mb-2">{user.name}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 pb-20 lg:pb-0">
        {/* Header — mobile only */}
        <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
          <h1 className="font-semibold text-gray-900">SakuTask</h1>
          <button onClick={logout} className="text-gray-400 hover:text-red-600">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="max-w-md mx-auto px-4 py-4 lg:max-w-4xl lg:px-8 lg:py-8">
          <Outlet />
        </main>

        {/* Bottom nav — mobile only */}
        <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 lg:hidden">
          <div className="max-w-md mx-auto grid grid-cols-3">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2.5 text-xs ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}