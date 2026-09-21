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
        <div className="pl-4 pr-3 py-[18px] border-b border-[var(--border-hairline)] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden group min-w-0">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-[var(--shadow-sm)] group-hover:scale-[1.03] transition-transform overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
              <img
                src="/logo.png"
                alt="SkillSync Mark"
                className="w-6 h-6 object-contain"
              />
            </span>
            {!collapsed && (
              <div className="truncate">
                <span className="font-extrabold text-[15px] tracking-tight text-[var(--text-main)] block leading-none font-sans">
                  Skill<span className="text-gradient">Sync</span>
                </span>
                <span className="caption block mt-1 !text-[11px]">
                  Learn • Upskill • Grow
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent-color)]/50 hover:shadow-[var(--shadow-xs)] transition-all shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto scroll-thin">
          {!collapsed && (
            <div className="caption px-3 pb-2">
              Workspace
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
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 border border-transparent ${
                  active
                    ? 'bg-[var(--badge-bg)] border-[var(--accent-color)]/25 text-[var(--text-main)] shadow-[var(--shadow-xs)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-hairline)]'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full" style={{ background: 'var(--grad-accent)' }} />
                )}
                <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? 'text-[var(--accent-color)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`} />
                {!collapsed && (
                  <span className="truncate flex-1 font-sans text-[13px] tracking-tight">
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--badge-bg)] text-[var(--badge-text)] border border-[var(--accent-color)]/20 rounded-md">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom: Theme + User */}
        <div className="p-2.5 border-t border-[var(--border-hairline)] space-y-2 bg-[var(--bg-surface)]/60">
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            id="nav-theme-toggle"
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent-color)]/50 hover:shadow-[var(--shadow-xs)] transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Toggle theme"
          >
            {theme === 'dark'
              ? <Moon className="w-4 h-4 text-amber-400 shrink-0" />
              : <Sun className="w-4 h-4 text-orange-500 shrink-0" />}
            {!collapsed && (
              <span className="text-[13px] font-medium font-sans">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            )}
          </button>

          {/* User card */}
          {user ? (
            <div
              onClick={handlePfpClick}
              title="View Profile (/profile)"
              className="flex items-center justify-between p-2 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] cursor-pointer hover:border-[var(--accent-color)]/50 hover:shadow-[var(--shadow-sm)] transition-all group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Avatar"
                    className="w-8 h-8 rounded-xl object-cover border border-[var(--border-hairline)] shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[13px] shrink-0 text-white shadow-[var(--shadow-xs)]"
                       style={{ background: 'var(--grad-accent)' }}>
                    {user.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                )}
                {!collapsed && (
                  <div className="truncate min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--text-main)] truncate leading-tight font-sans tracking-tight">
                      {user.displayName || 'Dev User'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate font-sans">
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
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--diff-del)] rounded-lg hover:bg-[var(--diff-del-bg)] transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-secondary w-full py-2 px-3 text-[13px] justify-center"
            >
              {!collapsed ? '$ login' : '>'}
            </Link>
          )}
        </div>
      </aside>

      {/* ── MOBILE HEADER ───────────────────────────────────────── */}
      <div className="md:hidden sticky top-0 z-40 glass-card border-b border-[var(--border-hairline)] px-4 py-3 flex items-center justify-between">
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
        <div className="md:hidden fixed inset-x-0 top-[53px] glass-card border-b border-[var(--border-hairline)] p-4 z-40 space-y-1 text-[13px] shadow-xl animate-fade-up">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium border border-transparent transition-all ${
                  active ? 'bg-[var(--badge-bg)] text-[var(--text-main)] border border-[var(--accent-color)]/25' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[var(--accent-color)]' : 'text-[var(--text-muted)]'}`} />
                {item.label}
                {item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--badge-bg)] text-[var(--badge-text)] rounded-md">
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
              <span className="font-semibold">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

