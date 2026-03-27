import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useSocket } from '../contexts/SocketContext.jsx';
import {
  LayoutDashboard, PlusCircle, History, Map, Users,
  Activity, Salad, ClipboardList, LogOut, Bell, Wifi, WifiOff,
} from 'lucide-react';
import { useState } from 'react';

const navConfig = {
  donor: [
    { to: '/donor', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/donor/add', icon: PlusCircle, label: 'Donate Food' },
    { to: '/donor/history', icon: History, label: 'My Donations' },
    { to: '/donor/map', icon: Map, label: 'Map View' },
  ],
  ngo: [
    { to: '/ngo', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/ngo/available', icon: Salad, label: 'Available Food' },
    { to: '/ngo/claimed', icon: ClipboardList, label: 'My Claims' },
    { to: '/ngo/map', icon: Map, label: 'Map View' },
  ],
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/activities', icon: Activity, label: 'Activities' },
    { to: '/admin/map', icon: Map, label: 'Map View' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { connected, notifications } = useSocket();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  const links = navConfig[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColor = {
    donor: 'text-primary-400 bg-primary-900',
    ngo: 'text-trust-400 bg-trust-900',
    admin: 'text-purple-400 bg-purple-900',
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-extrabold gradient-text">HashItOut</h1>
          <p className="text-xs text-muted mt-0.5">Food Redistribution Platform</p>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-800 flex items-center justify-center text-primary-300 font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate text-sm">{user?.name}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleColor[user?.role]}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-900 text-primary-300 border border-primary-800'
                    : 'text-slate-400 hover:text-white hover:bg-cardHover'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: connection + logout */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center gap-2 text-xs">
            {connected
              ? <><Wifi size={14} className="text-primary-400" /><span className="text-primary-400">Live</span></>
              : <><WifiOff size={14} className="text-red-400" /><span className="text-red-400">Offline</span></>
            }
          </div>
          <button onClick={handleLogout} className="btn-secondary w-full justify-center text-sm">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <div />
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                id="notifications-btn"
                onClick={() => setShowNotif(v => !v)}
                className="p-2 rounded-xl bg-surface border border-border hover:border-primary-700 transition-colors relative"
              >
                <Bell size={18} className="text-slate-300" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <span className="font-semibold text-white text-sm">Notifications</span>
                    <button onClick={() => setShowNotif(false)} className="text-muted hover:text-white text-xs">Close</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0
                      ? <p className="text-muted text-sm text-center py-8">No notifications</p>
                      : notifications.slice(0, 15).map(n => (
                        <div key={n.id} className="px-4 py-3 border-b border-border/50 hover:bg-cardHover transition-colors">
                          <p className="text-sm text-slate-200">{n.message || n.type}</p>
                          <p className="text-xs text-muted mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
