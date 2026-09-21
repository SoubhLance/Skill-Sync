import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  FileCheck2,
  Code2,
  Compass,
  FileText,
  Sparkles,
  Rocket,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard',      path: '/dashboard',      icon: LayoutDashboard },
    { label: 'JD Matcher',     path: '/jd-match',       icon: FileCheck2 },
    { label: 'DSA + Code',     path: '/dsa-code',       icon: Code2 },
    { label: 'Career Path',    path: '/career-path',    icon: Compass },
    { label: 'Resume Builder', path: '/resume-builder', icon: FileText },
    { label: 'Optimizer',      path: '/optimizer',      icon: Sparkles },
    { label: 'InterroX',       path: '/interrox',       icon: Rocket, badge: 'SOON' },
  ];

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await logout();
    navigate('/login');
  };

  const handlePfpClick = () => navigate('/profile');

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 z-30 transition-all duration-300 glass-sidebar ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Animated gradient accent strip — left edge */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 accent-strip" />

        {/* Brand Header */}
        <div className="pl-4 pr-3 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between font-mono">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden group min-w-0">
            <img
              src="/logo.png"
              alt="SkillSync Mark"
              className="w-8 h-8 object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            {!collapsed && (
              <div className="truncate">
                <span className="font-extrabold text-sm tracking-tight text-[var(--text-main)] block leading-none">
                  Skill<span className="text-[var(--accent-color)]">Sync</span>
                </span>
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mt-0.5">
                  Learn • Upskill • Grow
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent-color)] transition-all shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto font-mono text-xs">
          {!collapsed && (
            <div className="px-3 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                id={`nav-${item.path.replace('/', '')}`}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  active
                    ? 'btn-accent shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-paper)]'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                {!collapsed && (
                  <span className="truncate flex-1 font-sans text-xs">
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[var(--badge-bg)] text-[var(--badge-text)] rounded-md">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom: Theme + User */}
        <div className="p-2 border-t border-[var(--border-hairline)] space-y-1.5">
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            id="nav-theme-toggle"
            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent-color)] transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Toggle theme"
          >
            {theme === 'dark'
              ? <Moon className="w-4 h-4 text-amber-400 shrink-0" />
              : <Sun className="w-4 h-4 text-orange-500 shrink-0" />}
            {!collapsed && (
              <span className="text-xs font-mono font-semibold">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            )}
          </button>

          {/* User card */}
          {user ? (
            <div
              onClick={handlePfpClick}
              title="View Profile (/profile)"
              className="flex items-center justify-between p-2 rounded-xl border border-[var(--border-hairline)] cursor-pointer hover:border-[var(--accent-color)] transition-all group card-lift"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Avatar"
                    className="w-7 h-7 rounded-lg object-cover border border-[var(--border-hairline)] shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 text-white"
                       style={{ background: 'var(--grad-accent)' }}>
                    {user.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                )}
                {!collapsed && (
                  <div className="truncate min-w-0">
                    <p className="text-xs font-bold text-[var(--text-main)] truncate leading-tight group-hover:text-[var(--accent-color)] transition-colors">
                      {user.displayName || 'Dev User'}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">
                      {user.email}
                    </p>
                  </div>
                )}
              </div>

              {!collapsed && (
                <button
                  onClick={handleLogout}
                  id="btn-logout"
                  title="Sign out"
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--diff-del)] rounded-lg hover:bg-[var(--diff-del-bg)] transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="w-full py-2 px-3 rounded-xl btn-accent font-mono font-bold text-xs text-center block"
            >
              {!collapsed ? '$ login' : '>'}
            </Link>
          )}
        </div>
      </aside>

      {/* ── MOBILE HEADER ───────────────────────────────────────── */}
      <div className="md:hidden sticky top-0 z-40 glass-card border-b border-[var(--border-hairline)] px-4 py-3 flex items-center justify-between font-mono">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="SkillSync Logo" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-sm text-[var(--text-main)]">
            Skill<span className="text-[var(--accent-color)]">Sync</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <div onClick={handlePfpClick} className="cursor-pointer">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-lg object-cover border border-[var(--border-hairline)]" />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                     style={{ background: 'var(--grad-accent)' }}>
                  {user.displayName?.charAt(0).toUpperCase() || 'D'}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg border border-[var(--border-hairline)] text-[var(--text-main)]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── MOBILE MENU OVERLAY ─────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-[53px] glass-card border-b border-[var(--border-hairline)] p-4 z-40 space-y-1 font-mono text-xs shadow-xl animate-fade-up">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold transition-all ${
                  active ? 'btn-accent' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-paper)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[var(--accent-color)]'}`} />
                {item.label}
                {item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[var(--badge-bg)] text-[var(--badge-text)] rounded-md">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Mobile theme toggle */}
          <div className="pt-2 border-t border-[var(--border-hairline)] mt-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-paper)] transition-all"
            >
              {theme === 'dark'
                ? <Moon className="w-4 h-4 text-amber-400" />
                : <Sun className="w-4 h-4 text-orange-500" />}
              <span className="font-semibold">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

