'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import dynamic from 'next/dynamic';

const GlobalSearch = dynamic(
  () => import('@/components/search/GlobalSearch'),
  { ssr: false }
);

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/hypotheques': 'Liste des Hypothèques',
  '/hypotheques/new': 'Nouvelle Hypothèque',
  '/clients': 'Gestion des Clients',
  '/prets': 'Gestion des Prêts',
  '/workflow': 'Workflow de Validation',
  '/provisions': 'Provisions IFRS 9 / BCEAO',
  '/scoring': 'Scoring & Analyse de Risque',
  '/reporting-bceao': 'Reporting BCEAO',
  '/reporting': 'Reporting Annuel',
  '/ged':        'GED — Documents',
  '/assurances': 'Module Assurances',
  '/bi':         'Tableau de bord BI',
  '/alertes': 'Alertes',
  '/carte': 'Carte des biens',
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
  if (pathname.startsWith('/provisions')) return 'Provisions IFRS 9 / BCEAO';
  if (pathname.startsWith('/scoring')) return 'Scoring & Analyse de Risque';
  if (pathname.startsWith('/reporting-bceao')) return 'Reporting BCEAO';
  if (pathname.startsWith('/ged')) return 'GED — Documents';
  if (pathname.startsWith('/assurances')) return 'Module Assurances';
  if (pathname.startsWith('/bi')) return 'Tableau de bord BI';
  if (pathname.startsWith('/carte')) return 'Carte des biens';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={getTitle(pathname)} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-3 md:p-6 overflow-auto dark:bg-slate-950">{children}</main>
      </div>
      <GlobalSearch />
    </div>
  );
}
