'use client';

import { Bell, Menu, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { alertesApi } from '@/lib/api';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    alertesApi
      .list({ statut: 'NON_LU', limit: 100 })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setUnreadCount(data.length);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-slate-100 -ml-2 mr-2"
        aria-label="Menu"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        <p className="text-xs text-slate-500 hidden sm:block">
          Circulaire 04-2017 — Gestion des Garanties Hypothécaires
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search hint */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-500">
          <Search className="w-3.5 h-3.5" />
          <span>Rechercher...</span>
        </div>

        {/* Alerts bell */}
        <Link
          href="/alertes"
          className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
