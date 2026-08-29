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
  ChevronRight
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'JD Matcher', path: '/jd-match', icon: FileCheck2 },
    { label: 'DSA + Code', path: '/dsa-code', icon: Code2 },
    { label: 'Career Path', path: '/career-path', icon: Compass },
    { label: 'Resume Builder', path: '/resume-builder', icon: FileText },
    { label: 'Optimizer', path: '/optimizer', icon: Sparkles },
    { label: 'InterroX', path: '/interrox', icon: Rocket, badge: 'SOON' },
  ];

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to /profile
    await logout();
    navigate('/login');
  };

  const handlePfpClick = () => {
    navigate('/profile');
  };

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside
        className={`hidden md:flex flex-col border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] h-screen sticky top-0 z-30 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header with Logo */}
        <div className="p-4 border-b border-[var(--border-hairline)] flex items-center justify-between font-mono">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden group">
            <img src="/logo.png" alt="SkillSync Mark" className="w-8 h-8 object-contain shrink-0" />
            {!collapsed && (
              <div className="truncate">
                <span className="font-extrabold text-base tracking-tight text-[var(--text-main)] block leading-none">
                  Skill<span className="text-[var(--accent-color)]">Sync</span>
                </span>
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mt-1">
                  Learn • Upskill • Grow
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-sm border border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links List */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto font-mono text-xs">
          {!collapsed && (
            <div className="px-3 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
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
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-semibold transition-all border ${
                  active
                    ? 'btn-accent border-transparent shadow-sm'
                    : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)] hover:bg-[var(--bg-paper)]'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#0A192F]' : 'text-[var(--text-muted)]'}`} />
                {!collapsed && (
                  <span className="truncate flex-1 font-sans text-xs">
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[var(--badge-bg)] text-[var(--badge-text)] rounded-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom User Area & Theme Switcher */}
        <div className="p-3 border-t border-[var(--border-hairline)] bg-[var(--bg-paper)] font-mono text-xs space-y-2">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between p-2 rounded-sm border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-paper)] transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Toggle theme"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-orange-500" />}
              {!collapsed && <span>{theme === 'dark' ? 'Dark Ochre' : 'Warm Cream'}</span>}
            </span>
          </button>

          {/* User Avatar Card (Direct PFP Route to /profile) */}
          {user ? (
            <div
              onClick={handlePfpClick}
              title="Click to view Profile Settings (/profile)"
              className="flex items-center justify-between p-2 rounded-sm bg-[var(--bg-surface)] border border-[var(--border-hairline)] cursor-pointer hover:border-[var(--accent-color)] transition-colors group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-sm object-cover border border-[var(--border-hairline)] shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-sm bg-[var(--accent-color)] text-[#0A192F] flex items-center justify-center font-bold text-xs shrink-0">
                    {user.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                )}
                {!collapsed && (
                  <div className="truncate">
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
                  title="Sign out"
                  className="p-1 text-[var(--text-muted)] hover:text-[#CF222E] rounded-sm hover:bg-[#FFEBE9] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="w-full py-2 px-3 rounded-sm btn-accent font-mono font-bold text-xs text-center block"
            >
              {!collapsed ? '$ login' : '>'}
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-[var(--bg-surface)] border-b border-[var(--border-hairline)] px-4 py-3 flex items-center justify-between font-mono">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="SkillSync Logo" className="w-7 h-7 object-contain" />
          <span className="font-bold text-sm text-[var(--text-main)]">
            Skill<span className="text-[var(--accent-color)]">Sync</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* User PFP direct route for mobile */}
          {user && (
            <div onClick={handlePfpClick} className="cursor-pointer">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-sm object-cover border border-[var(--border-hairline)]" />
              ) : (
                <div className="w-7 h-7 rounded-sm bg-[var(--accent-color)] text-[#0A192F] flex items-center justify-center font-bold text-xs">
                  {user.displayName?.charAt(0).toUpperCase() || 'D'}
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-sm border border-[var(--border-hairline)] text-[var(--text-main)] bg-[var(--bg-paper)]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-[53px] bg-[var(--bg-surface)] border-b border-[var(--border-hairline)] p-4 z-40 space-y-2 font-mono text-xs shadow-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm font-semibold ${
                  active
                    ? 'btn-accent font-bold'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                <Icon className="w-4 h-4 text-[var(--accent-color)]" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
};
