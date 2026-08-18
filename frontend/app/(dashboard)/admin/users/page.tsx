'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api';
import { ROLE_LABELS } from '@/lib/format';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  Users,
} from 'lucide-react';
import type { User, UserRole } from '@/types';

interface UserForm {
  nom: string;
  email: string;
  password: string;
  role: UserRole;
}

const ROLE_OPTIONS: UserRole[] = ['ADMIN', 'RESPONSABLE_RISQUES', 'CHARGE_CLIENTELE', 'ENGAGEMENTS', 'AUDIT_INTERNE'];

export default function AdminUsersPage() {
  const { hasRole, isLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>({ nom: '', email: '', password: '', role: 'CHARGE_CLIENTELE' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !hasRole('ADMIN')) {
      router.push('/');
    }
  }, [isLoading, hasRole, router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await usersApi.list();
      setUsers(res.data?.data ?? res.data ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nom: '', email: '', password: '', role: 'CHARGE_CLIENTELE' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({ nom: user.nom, email: user.email, password: '', role: user.role });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Supprimer l'utilisateur ${user.nom} ?`)) return;
    try {
      await usersApi.delete(user.id);
      await load();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.nom || !form.email || !form.role) {
      setError('Nom, email et rôle sont requis.');
      return;
    }
    if (!editing && !form.password) {
      setError('Le mot de passe est requis pour un nouvel utilisateur.');
      return;
    }
    setSaving(true);
    try {
      const payload = editing
        ? { nom: form.nom, email: form.email, role: form.role, ...(form.password ? { password: form.password } : {}) }
        : form;
      if (editing) {
        await usersApi.update(editing.id, payload);
      } else {
        await usersApi.create(payload);
      }
      setShowModal(false);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Erreur lors de la sauvegarde';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const roleColor: Record<UserRole, string> = {
    ADMIN: 'badge-danger',
    RESPONSABLE_RISQUES: 'badge-warning',
    CHARGE_CLIENTELE: 'badge-info',
    ENGAGEMENTS: 'badge-success',
    AUDIT_INTERNE: 'badge-muted',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">
            {users.length} utilisateur{users.length !== 1 ? 's' : ''} enregistrés
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"
        >
          <Plus className="w-4 h-4" />
          Nouvel Utilisateur
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !users.length ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-600 font-medium">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {user.nom?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{user.nom}</span>
                      </div>
                    </td>
                    <td className="text-slate-600">{user.email}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColor[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">
                {editing ? 'Modifier l\'utilisateur' : 'Nouvel Utilisateur'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="form-label">Nom complet *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="form-input"
                  placeholder="Prénom Nom"
                />
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="form-input"
                  placeholder="prenom.nom@banque.com"
                />
              </div>
              <div>
                <label className="form-label">
                  Mot de passe {editing ? '(laisser vide pour conserver)' : '*'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="form-input"
                  placeholder={editing ? '••••••••' : 'Nouveau mot de passe'}
                />
              </div>
              <div>
                <label className="form-label">Rôle *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="form-input"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:bg-blue-400"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editing ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
