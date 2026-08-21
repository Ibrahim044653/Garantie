'use client';

import { Bell, Menu, Search, Sun, Moon, ChevronDown, UserCircle, LogOut, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/lib/notifications';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { unreadCount, refresh } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const openSearch = () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
    );
  };

  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowNotifications(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showNotifications]);

  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu]);

  const handleCountChange = (count: number) => {
    if (count === 0) refresh();
  };

  const displayName = user?.nom ?? user?.email?.split('@')[0] ?? 'Utilisateur';

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 px-4 md:px-6 sticky top-0 z-10">

      {/* Hamburger (mobile) + titre */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:text-slate-300 flex-shrink-0"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      <h1 className="text-base font-bold text-slate-800 dark:text-white flex-shrink-0 hidden sm:block">
        {title}
      </h1>

      {/* Search — centré, prend l'espace disponible */}
      <button
        onClick={openSearch}
        className="flex-1 max-w-md mx-auto flex items-center gap-2 px-4 py-2 text-sm text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        aria-label="Ouvrir la recherche"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">Recherche...</span>
        <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono text-slate-500">
          Ctrl K
        </kbd>
      </button>

      {/* Actions droite */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            ref={bellRef}
            onClick={() => setShowNotifications((v) => !v)}
            className={`relative p-2 rounded-lg transition-colors ${
              showNotifications ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-600 dark:text-slate-400'
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

        {/* User dropdown — style D-CLIC */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-28 truncate">
              {displayName}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate capitalize mt-0.5">
                  {user?.role?.toLowerCase().replace(/_/g, ' ')}
                </p>
              </div>
              <div className="py-1">
                <Link
                  href="/profil"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <UserCircle className="w-4 h-4 text-slate-400" />
                  Mon profil
                </Link>
                <Link
                  href="/admin/users"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Paramètres
                </Link>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                <button
                  onClick={() => { setShowUserMenu(false); logout(); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
