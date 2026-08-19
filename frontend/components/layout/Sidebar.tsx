'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Bell,
  Users,
  LogOut,
  ChevronRight,
  Landmark,
  UserCircle,
  CreditCard,
  GitBranch,
  ShieldAlert,
  TrendingUp,
  FileText,
  FolderOpen,
  ShieldCheck,
  PieChart,
} from 'lucide-react';

const navItems = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/hypotheques',
    label: 'Hypothèques',
    icon: Building2,
    exact: false,
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: Users,
    exact: false,
  },
  {
    href: '/prets',
    label: 'Prêts',
    icon: CreditCard,
    exact: false,
  },
  {
    href: '/workflow',
    label: 'Workflow',
    icon: GitBranch,
    exact: false,
  },
  {
    href: '/provisions',
    label: 'Provisions IFRS 9',
    icon: ShieldAlert,
    exact: false,
  },
  {
    href: '/scoring',
    label: 'Scoring & Risque',
    icon: TrendingUp,
    exact: false,
  },
  {
    href: '/reporting-bceao',
    label: 'Reporting BCEAO',
    icon: FileText,
    exact: false,
  },
  {
    href: '/ged',
    label: 'Documents (GED)',
    icon: FolderOpen,
    exact: false,
  },
  {
    href: '/assurances',
    label: 'Assurances',
    icon: ShieldCheck,
    exact: false,
  },
  {
    href: '/bi',
    label: 'Dashboard BI',
    icon: PieChart,
    exact: false,
  },
  {
    href: '/reporting',
    label: 'Reporting',
    icon: BarChart3,
    exact: false,
  },
  {
    href: '/alertes',
    label: 'Alertes',
    icon: Bell,
    exact: false,
  },
];

const adminItems = [
  {
    href: '/admin/users',
    label: 'Utilisateurs',
    icon: Users,
    exact: false,
  },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`flex flex-col w-64 min-h-screen fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ background: 'var(--sidebar-bg)' }}
      >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
          <Landmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white text-sm font-bold leading-tight">SGH</p>
          <p className="text-slate-400 text-xs leading-tight">Hypothèques</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
            {user?.nom?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user?.nom ?? '—'}
            </p>
            <p className="text-slate-400 text-xs truncate capitalize">
              {user?.role?.toLowerCase().replace(/_/g, ' ') ?? ''}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
          Menu principal
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`sidebar-link ${active ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3" />}
            </Link>
          );
        })}

        {hasRole('ADMIN') && (
          <>
            <div className="my-3 border-t border-slate-700" />
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
              Administration
            </p>
            {adminItems.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`sidebar-link ${active ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-3 h-3" />}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700 space-y-1">
        <Link
          href="/profil"
          onClick={onClose}
          className={`sidebar-link ${pathname === '/profil' ? 'active' : ''}`}
        >
          <UserCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">Mon Profil</span>
          {pathname === '/profil' && <ChevronRight className="w-3 h-3" />}
        </Link>
        <button
          onClick={logout}
          className="sidebar-link w-full hover:text-red-400"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
      </aside>
    </>
  );
}
