# DOCUMENT DE LIVRAISON — SGH v1.0.0
## Système de Gestion des Hypothèques
### Société Ivoirienne de Banque (SIB)

---

**Version :** 1.0.0 (stable)  
**Date de livraison :** 19 août 2026  
**Tag Git :** `v1.0.0`  
**Référence réglementaire :** Circulaire BCEAO n°04-2017  
**Statut :** Production — figée pour démonstration client

---

## 1. ACCÈS À L'APPLICATION

### 1.1 URLs de production

| Service | URL | Statut |
|---|---|---|
| **Application Web (Frontend)** | https://sgh-frontend.vercel.app | Opérationnel |
| **API Backend** | https://sgh-backend-production-297b.up.railway.app | Opérationnel |
| **Health check** | https://sgh-backend-production-297b.up.railway.app/api/health | Opérationnel |

### 1.2 Comptes de démonstration

| Profil | Email | Mot de passe | Accès |
|---|---|---|---|
| **Administrateur** | admin@banque.sn | Admin@1234 | Accès total |
| **Gestionnaire Garanties** | gestionnaire@banque.sn | Gest@1234 | Gestion opérationnelle |
| **Responsable Risques** | risques@banque.sn | Risques@1234 | Lecture + reporting |
| **Engagements** | engagements@banque.sn | Engag@1234 | Consultation uniquement |
| **Audit Interne** | audit@banque.sn | Audit@1234 | Audit + traçabilité |

---

## 2. CODE SOURCE

### 2.1 Dépôt GitHub

| Élément | Valeur |
|---|---|
| **Dépôt** | https://github.com/Ibrahim044653/Projet-Garantie |
| **Branche v1 (figée)** | https://github.com/Ibrahim044653/Projet-Garantie/tree/v1 |
| **Tag v1.0.0** | https://github.com/Ibrahim044653/Projet-Garantie/releases/tag/v1.0.0 |
| **Branche v2 (développement)** | https://github.com/Ibrahim044653/Projet-Garantie/tree/v2 |

### 2.2 Structure du projet

```
Projet-Garantie/
├── frontend/          # Next.js 16 — déployé sur Vercel
├── backend/           # Node.js + Express — déployé sur Railway
│   └── prisma/        # Schéma SQLite + migrations
└── docs/              # Livrables TDR (PDF + Markdown)
```

---

## 3. INFRASTRUCTURE DE DÉPLOIEMENT

### 3.1 Frontend — Vercel

| Paramètre | Valeur |
|---|---|
| Plateforme | Vercel |
| Projet | sgh-frontend |
| Branche déployée | main |
| Framework | Next.js 16.2.10 (App Router) |
| URL production | https://sgh-frontend.vercel.app |
| Build auto | Oui — à chaque push sur main |

### 3.2 Backend — Railway

| Paramètre | Valeur |
|---|---|
| Plateforme | Railway |
| Projet | divine-charisma |
| Service | sgh-backend |
| Région | Amsterdam (ams) |
| URL production | https://sgh-backend-production-297b.up.railway.app |
| Base de données | SQLite (fichier hypotheque.db) |
| Build auto | Oui — à chaque push sur main |

### 3.3 Variables d'environnement Railway (backend)

| Variable | Valeur |
|---|---|
| NODE_ENV | production |
| PORT | 3001 |
| JWT_SECRET | sgh_sib_prod_2026_secret_key |
| FRONTEND_URL | https://sgh-frontend.vercel.app |
| DATABASE_URL | file:./prisma/hypotheque.db |

### 3.4 Variables Vercel (frontend)

| Variable | Valeur |
|---|---|
| NEXT_PUBLIC_API_URL | https://sgh-backend-production-297b.up.railway.app/api |
| BACKEND_URL | https://sgh-backend-production-297b.up.railway.app |

---

## 4. FONCTIONNALITÉS LIVRÉES (v1.0.0)

### 4.1 Authentification et sécurité
- Connexion par email / mot de passe (JWT httpOnly cookie + Bearer)
- Double authentification TOTP (MFA) via Google Authenticator
- Contrôle d'accès basé sur les rôles (RBAC — 5 profils)
- Session expirée après 1h (configurable)

### 4.2 Gestion des hypothèques
- Création, modification, consultation, suppression des dossiers
- Import en masse via fichier CSV
- Téléchargement des PJ expertise (PDF)
- Filtres : zone, statut, recherche texte (nom, N° TF, N° prêt, ville)
- Pagination

### 4.3 Calcul réglementaire (Circulaire 04-2017)
- Décotes géographiques : Zone A (20%), B (30%), C (45%), Industrielle (40%)
- Décotes d'ancienneté : 0-3 ans (0%), 3-5 ans (10%), >5 ans (100%)
- Décotes d'occupation : Libre (0%), Propriétaire (5%), Loué (15%)
- VNC = Valeur expertise × (1 − décote totale)
- LTV = Solde prêt / VNC × 100
- Détection automatique des shortfalls (LTV > 100%)

### 4.4 Réévaluation des garanties
- Réévaluation manuelle bisannuelle (nouveaux paramètres + motif obligatoire)
- Revalorisation par indice pour les 2ème et 3ème rangs
- Historique complet et tracé (qui, quand, quoi, pourquoi)

### 4.5 Alertes réglementaires (5 types)
- SHORTFALL — LTV > 100%
- EXPERTISE_EXPIREE — expertise > 2 ans
- EXPERTISE_BIENTOT_EXPIREE — expertise entre 21 et 24 mois
- EXPERTISE_RENOUVELLEMENT — alerte préventive 3 mois avant 2 ans
- INSCRIPTION_PERIMEE — inscription hypothécaire expirée
- Régénération automatique toutes les 24h

### 4.6 Reporting et exports
- Rapport annuel avec KPIs du portefeuille
- Export CSV (données brutes)
- Export Excel (tableau formaté .xlsx)

### 4.7 Administration
- Gestion des utilisateurs (CRUD) — Admin uniquement
- 5 rôles : ADMIN, GESTIONNAIRE_GARANTIES, RESPONSABLE_RISQUES, ENGAGEMENTS, AUDIT_INTERNE
- Configuration MFA par compte

---

## 5. LIVRABLES DOCUMENTAIRES

Tous les documents sont disponibles dans le dossier `/docs` du dépôt GitHub :

| Document | Fichier | Description |
|---|---|---|
| Guide Utilisateur | guide-utilisateur.pdf | Procédures par fonctionnalité |
| Documents Techniques | documents-techniques.pdf | Architecture, API, modèle de données |
| Guide d'Administration | guide-administration.pdf | Installation, déploiement, maintenance |
| Rapport Annuel 2026 | rapport-annuel-2026.pdf | Tableau de bord arrêté 19/08/2026 |
| Présentation par Profil | presentation-fonctionnalites.pdf | Fonctionnalités par rôle utilisateur |

**Accès direct :** https://github.com/Ibrahim044653/Projet-Garantie/tree/v1/docs

---

## 6. DONNÉES DE DÉMONSTRATION

### 6.1 Portefeuille de test (10 dossiers)

| N° TF | Client | Zone | VNC (FCFA) | LTV | Statut |
|---|---|---|---|---|---|
| TF/DK/12345 | Société Immobilière du Sénégal | Zone A | 162 500 000 | 110,8% | SHORTFALL |
| TF/DK/67890 | Amadou Diop | Zone A | 117 000 000 | 102,6% | SHORTFALL |
| TF/TH/11223 | Entreprise Batibuild | Zone B | 227 500 000 | 123,1% | SHORTFALL |
| TF/ZG/44556 | Marie Claire Mendy | Zone C | 20 250 000 | 187,7% | SHORTFALL |
| TF/DK/99887 | Groupe Commercial Thiaw | Zone A | 273 000 000 | 142,9% | SHORTFALL |
| TF/KL/33214 | Ibrahima Fall | Zone B | 0 | 999%+ | SHORTFALL |
| TF/ZG/77654 | Agroalimentaire Casamance SA | Zone C | 110 000 000 | 177,3% | SHORTFALL |
| TF/DK/56781 | Fatou Diallo Wade | Zone A | 108 000 000 | 106,5% | SHORTFALL |
| TF/MB/23456 | Complexe Hôtelier Teranga | Zone B | 306 000 000 | 179,7% | SHORTFALL |
| TF/TH/98765 | Cheikh Ahmadou Bamba Touré | Zone B | 19 600 000 | 112,2% | SHORTFALL |

### 6.2 Indicateurs globaux du portefeuille de démo

| Indicateur | Valeur |
|---|---|
| VNC totale | 1 343 850 000 FCFA |
| Encours total | 1 965 000 000 FCFA |
| LTV moyen | ~138% |
| Dossiers en shortfall | 10 / 10 |
| Alertes actives | 21 |

---

## 7. STACK TECHNIQUE

| Composant | Technologie | Version |
|---|---|---|
| Frontend | Next.js (App Router) | 16.2.10 |
| UI | React | 19 |
| Langage | TypeScript | 5.x |
| Style | Tailwind CSS | 3.x |
| Backend | Node.js + Express | 20 LTS |
| ORM | Prisma | 5.x |
| Base de données | SQLite | 3.x |
| Authentification | JWT + bcryptjs | — |
| MFA | speakeasy (TOTP) | — |
| Hébergement frontend | Vercel | — |
| Hébergement backend | Railway | — |
| CI/CD | GitHub → Auto-deploy | — |

---

## 8. ORGANISATION GIT (VERSIONS)

```
GitHub: Ibrahim044653/Projet-Garantie
│
├── main   ──── v1 (figée) ──── Vercel v1 + Railway v1
│                                → URL clients actuelles
│
├── v1     ──── Branche de référence stable (identique à main)
│
└── v2     ──── Développement v2 (à venir)
                → Nouveaux Vercel v2 + Railway v2
```

**Règle :** La branche `main` et `v1` ne seront plus modifiées. Tout nouveau développement se fait sur `v2`.

---

## 9. CONTACT ET SUPPORT

| Rôle | Contact |
|---|---|
| Développeur | ibrahim.coulibaly@accenture.com |
| Dépôt GitHub | https://github.com/Ibrahim044653/Projet-Garantie |
| Application | https://sgh-frontend.vercel.app |

---

*SGH v1.0.0 — Société Ivoirienne de Banque*  
*Document de livraison — 19 août 2026*  
*Référence : SGH-LIVRAISON-V1-2026*
