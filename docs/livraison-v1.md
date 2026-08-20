# DOCUMENT DE LIVRAISON — SGH v1.0.0
## Système de Gestion des Hypothèques
### Société Ivoirienne de Banque (SIB)

---

**Version :** 2.0.0 (stable)  
**Date de livraison :** 20 août 2026  
**Tag Git :** `v2`  
**Référence réglementaire :** Circulaire BCEAO n°04-2017  
**Statut :** Production — déployée sur Vercel + Railway

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
| Service | Garantie |
| Base de données | PostgreSQL (Railway managed) |
| Dépôt source | Ibrahim044653/Garantie (remote `garantie`) |
| Build auto | Oui — à chaque push sur main du dépôt Garantie |

### 3.3 Variables d'environnement Railway (backend)

| Variable | Valeur |
|---|---|
| NODE_ENV | production |
| PORT | 3001 |
| JWT_SECRET | sgh_sib_prod_2026_secret_key |
| FRONTEND_URL | https://sgh-frontend.vercel.app |
| DATABASE_URL | Injectée automatiquement par Railway (PostgreSQL) |

### 3.4 Variables Vercel (frontend)

| Variable | Valeur |
|---|---|
| NEXT_PUBLIC_API_URL | `/api` |
| BACKEND_URL | URL Railway interne (injectée par Railway) |

---

## 4. FONCTIONNALITÉS LIVRÉES (v2.0.0)

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

### 4.8 Simulation & Prévision (nouveau en v2)
- Simulateur de réévaluation individuelle (impact VNC/LTV sans modification réelle)
- Stress test portefeuille (décote de marché globale paramétrable)
- Accessible à : Admin, Gestionnaire, Responsable Risques

### 4.9 Intelligence Artificielle (nouveau en v2)
- Score de risque automatique par dossier (0–100)
- Détection d'anomalies (valeurs incohérentes, LTV aberrants)
- Recommandations priorisées par urgence
- Accessible à : Admin, Gestionnaire, Responsable Risques, Audit Interne

### 4.10 Modules complémentaires (v2)
- GED (Gestion Électronique des Documents) — upload et consultation des pièces jointes
- Assurances — suivi des polices liées aux hypothèques
- Experts agréés — répertoire et suivi des certifications
- Mainlevées — gestion du cycle de mainlevée hypothécaire
- Recouvrement — suivi des procédures de recouvrement
- Journal d'audit — traçabilité complète de toutes les actions
- Notifications in-app — alertes temps réel
- Exports planifiés — exports automatiques récurrents (quotidien, mensuel)
- Import CSV — import en masse de dossiers
- Recherche globale full-text
- Business Intelligence — graphiques analytiques avancés
- Workflow de validation — circuits de signature multi-niveaux

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

### 6.1 Portefeuille de test (25 dossiers — seed v2)

| Référence | Zone | Statut | Notes |
|---|---|---|---|
| ZA-001 à ZA-008 | Zone A (×8) | Mixte | ZA-003 et ZA-006 : expertise + inscription expirées ; ZA-006 et ZA-008 : shortfall |
| ZB-009 à ZB-015 | Zone B (×7) | Mixte | ZB-009 : expertise + inscription expirées + shortfall ; ZB-013 : expertise expirée |
| ZC-016 à ZC-021 | Zone C (×6) | Mixte | ZC-016 et ZC-019 : shortfall ; ZC-019 : expertise + inscription expirées |
| ZI-022 à ZI-025 | Zone Industrielle (×4) | SAIN | Tous couverts |

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
