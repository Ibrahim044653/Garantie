'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/hypotheques': 'Liste des Hypothèques',
  '/hypotheques/new': 'Nouvelle Hypothèque',
  '/clients': 'Gestion des Clients',
  '/prets': 'Gestion des Prêts',
  '/workflow': 'Workflow de Validation',
  '/reporting': 'Reporting Annuel',
  '/alertes': 'Alertes',
  '/admin/users': 'Gestion des Utilisateurs',
  '/profil': 'Mon Profil',
};


function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/hypotheques/') && pathname.endsWith('/edit'))
    return 'Modifier Hypothèque';
  if (pathname.startsWith('/hypotheques/')) return 'Fiche Hypothèque';
  if (pathname.startsWith('/clients/')) return 'Fiche Client';
  if (pathname.startsWith('/prets/')) return 'Détail Prêt';
  return 'Tableau de bord';
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={getTitle(pathname)} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
