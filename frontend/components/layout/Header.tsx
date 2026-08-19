'use client';

import { Bell, Menu, Search, Sun, Moon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/lib/notifications';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { unreadCount, refresh } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  const openSearch = () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
    );
  };

  // Close on Escape key
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotifications(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showNotifications]);

  const handleCountChange = (count: number) => {
    // Sync unread count back — refresh will re-poll
    if (count === 0) refresh();
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:text-slate-300 -ml-2 mr-2"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>
      <div>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h1>
        <p className="text-xs text-slate-500 hidden sm:block">
          Circulaire 04-2017 — Gestion des Garanties Hypothécaires
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search button */}
        <button
          onClick={openSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
          aria-label="Ouvrir la recherche"
        >
          <Search className="w-4 h-4" />
          <span>Rechercher...</span>
          <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-xs bg-white border border-slate-300 rounded font-mono">
            Ctrl K
          </kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications bell */}
        <div className="relative">
          <button
            ref={bellRef}
            onClick={() => setShowNotifications((v) => !v)}
            className={`relative p-2 rounded-lg transition-colors ${
              showNotifications
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationPanel
              onClose={() => setShowNotifications(false)}
              onCountChange={handleCountChange}
            />
          )}
        </div>
      </div>
    </header>
  );
}
