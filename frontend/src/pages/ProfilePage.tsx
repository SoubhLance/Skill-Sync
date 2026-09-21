import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Mail, Shield, Moon, Sun, Save, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || 'Alex Developer');
  const [email] = useState(user?.email || 'alex.developer@example.com');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 font-sans text-[var(--text-main)] animate-fade-in">
      {/* Header */}
      <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono border-b border-[var(--border-hairline)]">
        <div>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5 mb-1">
            <User className="w-3.5 h-3.5 text-[var(--accent-color)]" /> $ skillsync user --settings
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-main)] font-sans">
            User Account Settings
          </h1>
        </div>

        <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface)] px-3 py-1 border border-[var(--border-hairline)] rounded-lg">
          direct PFP destination: /profile
        </span>
      </div>

      <div className="p-8 rounded-2xl glass-card space-y-6 font-mono text-xs">
        {/* User Avatar & Basic Metadata Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-[var(--border-hairline)]">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-16 h-16 rounded-xl object-cover border border-[var(--border-hairline)]" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-2)] text-white flex items-center justify-center font-bold text-xl shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h2 className="text-lg font-extrabold text-[var(--text-main)] font-sans leading-tight">
              {displayName}
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{email}</p>
            <span className="inline-block px-2.5 py-0.5 mt-1.5 rounded-md bg-[var(--badge-bg)] text-[var(--badge-text)] font-bold text-[10px] border border-[var(--border-hairline)]">
              VERIFIED DEVELOPER
            </span>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-main)] input-glow focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
                Primary Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono text-[var(--text-muted)] opacity-70 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Theme Preferences */}
          <div className="pt-4 border-t border-[var(--border-hairline)] space-y-2">
            <span className="block text-[11px] font-bold text-[var(--text-muted)] uppercase">
              Theme Mode Preference
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-paper)] hover:bg-[var(--bg-elevated)] text-[var(--text-main)] font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-4 h-4 text-amber-400" /> Active: Dark Mode (Comfortable Slate)
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-orange-500" /> Active: Light Mode (Warm Canvas)
                </>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl btn-accent font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" /> Save Profile Preferences
            </button>

            {saved && (
              <span className="text-[var(--diff-add)] font-bold text-xs">
                ✓ Preferences updated!
              </span>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--diff-del-bg)] text-[var(--diff-del)] hover:bg-[var(--diff-del)]/20 border border-[var(--diff-del)]/30 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
