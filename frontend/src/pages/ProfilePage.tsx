import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Shield, Moon, Sun, Save, LogOut } from 'lucide-react';
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
      <div className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-hairline)]">
        <div>
          <p className="eyebrow mb-1">Account</p>
          <h1 className="h-section text-2xl md:text-3xl">
            User Account Settings
          </h1>
        </div>

        <span className="chip shrink-0">
          /profile
        </span>
      </div>

      <div className="p-6 md:p-8 card space-y-6 text-[13px]">
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
            <p className="caption mt-0.5">{email}</p>
            <span className="chip chip-accent chip-xs mt-1.5">
              Verified developer
            </span>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label className="field-label">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-glow px-3.5 py-2.5"
              />
            </div>

            <div className="field">
              <label className="field-label">
                Primary email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="input-glow px-3.5 py-2.5 opacity-70 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Theme Preferences */}
          <div className="pt-4 border-t border-[var(--border-hairline)] space-y-2">
            <span className="field-label">
              Theme preference
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-secondary px-4 py-2.5 text-[13px]"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-4 h-4 text-[#6EE7B7]" /> Canopy mode active
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-[#4D7C0F]" /> Mist mode active
                </>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 btn-accent text-[13px]"
            >
              <Save className="w-4 h-4" /> Save preferences
            </button>

            {saved && (
              <span className="caption font-semibold text-[var(--diff-add)]">
                ✓ Preferences updated
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
