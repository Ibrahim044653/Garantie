import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT from cookie / localStorage on every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || getCookieToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function getCookieToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ---------- Auth ----------
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
};

// ---------- MFA ----------
export const mfaApi = {
  setup: () => apiClient.get('/auth/mfa/setup'),
  confirm: (token: string) => apiClient.post('/auth/mfa/confirm', { token }),
  validate: (userId: number, token: string) =>
    apiClient.post('/auth/mfa/validate', { userId, token }),
  disable: () => apiClient.delete('/auth/mfa/disable'),
};

// ---------- Hypothèques ----------
export const hypothequesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/hypotheques', { params }),
  get: (id: number | string) => apiClient.get(`/hypotheques/${id}`),
  create: (data: unknown) => apiClient.post('/hypotheques', data),
  update: (id: number | string, data: unknown) =>
    apiClient.put(`/hypotheques/${id}`, data),
  delete: (id: number | string) => apiClient.delete(`/hypotheques/${id}`),
  historique: (id: number | string) =>
    apiClient.get(`/hypotheques/${id}/historique`),
  revaloriser: (id: number | string, data: { indiceRevalorisation: number; motif: string }) =>
    apiClient.post(`/hypotheques/${id}/revaloriser`, data),
  exportCsv: (params?: Record<string, unknown>) =>
    apiClient.get('/hypotheques/export', { params, responseType: 'blob' }),
  exportExcel: (params?: Record<string, unknown>) =>
    apiClient.get('/hypotheques/export-excel', { params, responseType: 'blob' }),
};

// ---------- Alertes ----------
export const alertesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/dashboard/alertes', { params }),
  markRead: (id: number) => apiClient.put(`/dashboard/alertes/${id}/lue`),
  markAllRead: () => apiClient.put('/dashboard/alertes/lue-toutes'),
};

// ---------- Dashboard ----------
export const dashboardApi = {
  stats: () => apiClient.get('/dashboard/stats'),
};

// ---------- Reporting ----------
export const reportingApi = {
  annuel: (annee: number) =>
    apiClient.get('/reporting/annuel', { params: { annee } }),
  exportCsv: (annee: number) =>
    apiClient.get('/reporting/annuel/export', {
      params: { annee },
      responseType: 'blob',
    }),
  exportExcel: (annee: number) =>
    apiClient.get('/reporting/annuel/export-excel', {
      params: { annee },
      responseType: 'blob',
    }),
};

// ---------- Users (Admin) ----------
export const usersApi = {
  list: () => apiClient.get('/users'),
  get: (id: number) => apiClient.get(`/users/${id}`),
  create: (data: unknown) => apiClient.post('/users', data),
  update: (id: number, data: unknown) => apiClient.put(`/users/${id}`, data),
  delete: (id: number) => apiClient.delete(`/users/${id}`),
};

// ---------- Clients (CRM) ----------
export const clientsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/clients', { params }),
  getById: (id: number | string) => apiClient.get(`/clients/${id}`),
  create: (data: unknown) => apiClient.post('/clients', data),
  update: (id: number | string, data: unknown) =>
    apiClient.put(`/clients/${id}`, data),
  delete: (id: number | string) => apiClient.delete(`/clients/${id}`),
  stats: () => apiClient.get('/clients/stats'),
};

// ---------- Prêts ----------
export const pretsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/prets', { params }),
  getById: (id: number | string) => apiClient.get(`/prets/${id}`),
  create: (data: unknown) => apiClient.post('/prets', data),
  update: (id: number | string, data: unknown) =>
    apiClient.put(`/prets/${id}`, data),
  getEcheances: (id: number | string) =>
    apiClient.get(`/prets/${id}/echeances`),
  enregistrerPaiement: (id: number | string, data: unknown) =>
    apiClient.post(`/prets/${id}/paiements`, data),
  stats: () => apiClient.get('/prets/stats'),
};

// ---------- Workflow ----------
export const workflowApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/workflow', { params }),
  getById: (id: number | string) => apiClient.get(`/workflow/${id}`),
  create: (data: unknown) => apiClient.post('/workflow', data),
  valider: (id: number | string, data: unknown) =>
    apiClient.post(`/workflow/${id}/valider`, data),
  mesDemandes: () => apiClient.get('/workflow/mes-demandes'),
};

// ---------- Provisions IFRS 9 ----------
export const provisionsApi = {
  get: () => apiClient.get('/provisions'),
  export: () => apiClient.get('/provisions/export', { responseType: 'blob' }),
};

// ---------- Scoring ----------
export const scoringApi = {
  get: () => apiClient.get('/scoring'),
  stress: (facteur?: number) => apiClient.get('/scoring/stress', { params: { facteur } }),
};

// ---------- Reporting BCEAO ----------
export const reportingBceaoApi = {
  ratios: () => apiClient.get('/reporting-bceao/ratios'),
  export: () => apiClient.get('/reporting-bceao/export', { responseType: 'blob' }),
};

// ---------- GED ----------
export const gedApi = {
  list:       (params?: Record<string, unknown>) => apiClient.get('/ged', { params }),
  getById:    (id: number | string) => apiClient.get(`/ged/${id}`),
  stats:      () => apiClient.get('/ged/stats'),
  upload:     (formData: FormData) => apiClient.post('/ged', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addVersion: (id: number | string, formData: FormData) => apiClient.post(`/ged/${id}/versions`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  archive:    (id: number | string) => apiClient.put(`/ged/${id}/archive`),
  download:   (id: number | string) => apiClient.get(`/ged/${id}/download`, { responseType: 'blob' }),
};

// ---------- Assurances ----------
export const assurancesApi = {
  list:           (params?: Record<string, unknown>) => apiClient.get('/assurances', { params }),
  getById:        (id: number | string) => apiClient.get(`/assurances/${id}`),
  stats:          () => apiClient.get('/assurances/stats'),
  alertes:        () => apiClient.get('/assurances/alertes'),
  create:         (data: unknown) => apiClient.post('/assurances', data),
  update:         (id: number | string, data: unknown) => apiClient.put(`/assurances/${id}`, data),
  createSinistre: (id: number | string, data: unknown) => apiClient.post(`/assurances/${id}/sinistres`, data),
  updateSinistre: (assId: number | string, sinId: number | string, data: unknown) => apiClient.put(`/assurances/${assId}/sinistres/${sinId}`, data),
};

// ---------- BI Dashboard ----------
export const biApi = {
  overview:    () => apiClient.get('/bi/overview'),
  comparaison: (periode1: string, periode2: string) => apiClient.get('/bi/comparaison', { params: { periode1, periode2 } }),
  kpis:        () => apiClient.get('/bi/kpis'),
};

// ---------- Mainlevées ----------
export const mainleveesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/mainlevees', { params }),
  create: (data: unknown) => apiClient.post('/mainlevees', data),
  updateStatut: (id: number | string, data: unknown) =>
    apiClient.put(`/mainlevees/${id}/statut`, data),
  actePdf: (id: number | string) =>
    apiClient.get(`/mainlevees/${id}/acte-pdf`),
};

// ---------- Recouvrement ----------
export const recouvrementApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/recouvrement', { params }),
  create: (data: unknown) => apiClient.post('/recouvrement', data),
  updateStatut: (id: number | string, data: unknown) =>
    apiClient.put(`/recouvrement/${id}/statut`, data),
  createPlan: (id: number | string, data: unknown) =>
    apiClient.post(`/recouvrement/${id}/plan`, data),
  enregistrerPaiement: (echeanceId: number | string, data: unknown) =>
    apiClient.post(`/recouvrement/echeances/${echeanceId}/paiement`, data),
  stats: () => apiClient.get('/recouvrement/stats'),
};

// ---------- Audit ----------
export const auditApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/audit', { params }),
  export: () => apiClient.get('/audit/export', { responseType: 'blob' }),
};

// Helper to trigger CSV file download
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
