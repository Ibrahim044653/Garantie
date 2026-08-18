# SGH — Système de Gestion des Hypothèques
## Document des Fonctionnalités

> Application bancaire interne conforme à la **Circulaire 04-2017** (garanties hypothécaires)
> Stack : Next.js 16 (port 3000) + Node.js/Express (port 3001) + SQLite

---

## 1. Authentification & Contrôle d'accès

### 1.1 Connexion / Déconnexion
- Formulaire de connexion (email + mot de passe)
- Session via **JWT httpOnly cookie** (durée : 1 heure)
- Redirection automatique vers `/dashboard` si déjà connecté
- Déconnexion avec effacement du cookie

### 1.2 Rôles et permissions

| Rôle | Accès |
|------|-------|
| **ADMIN** | Toutes les fonctionnalités + gestion des utilisateurs |
| **GESTIONNAIRE_GARANTIES** | Créer, modifier, réévaluer, importer des hypothèques |
| **RESPONSABLE_RISQUES** | Lecture seule + alertes + reporting |

> Les routes backend appliquent la vérification de rôle côté serveur (middleware `requireGestionnaire` / `requireAdmin`).

---

## 2. Dashboard

URL : `/dashboard`

### 2.1 Indicateurs KPI (en temps réel)
- **Nombre total d'hypothèques** enregistrées
- **VNC totale** (Valeur Nette de Couverture du portefeuille)
- **Alertes actives** (non lues)
- **LTV moyen** du portefeuille
- **Nombre de shortfalls** (prêts non couverts)
- **Encours total des prêts**
- **Valeur d'expertise totale**

### 2.2 Graphiques
- **Répartition par zone géographique** : nombre et VNC par Zone A / B / C (camembert ou barres)
- **Répartition par nature de bien** : TERRAIN_NU, VILLA, IMMEUBLE_RAPPORT, USINE, BUREAU
- **Évolution VNC sur 12 mois** : VNC totale + LTV moyen mois par mois (courbe)
- **Top 5 shortfalls** : hypothèques avec le LTV le plus élevé (tableau)

### 2.3 Alertes récentes
- Liste des 5 dernières alertes non lues avec sévérité (CRITICAL / HIGH / MEDIUM)
- Lien vers la fiche concernée

---

## 3. Gestion des Hypothèques

### 3.1 Liste des hypothèques
URL : `/hypotheques`

- Tableau paginé (20 par page) avec toutes les hypothèques
- **Filtres disponibles** :
  - Recherche par nom client ou code client
  - Filtre par zone géographique (A / B / C)
  - Filtre par statut d'occupation
  - Filtre par type d'alerte
- Colonnes affichées : client, n° prêt, zone, VNC, LTV, statut, alertes actives
- **Statuts calculés automatiquement** :
  - `OK` — couverture suffisante, expertise valide
  - `ALERTE` — expertise entre 3 et 5 ans (décote 10%)
  - `EXPERTISE_OBSOLETE` — expertise > 5 ans (décote 100%, valeur nulle)
  - `SHORTFALL` — solde prêt > VNC (insuffisance de couverture)

### 3.2 Création d'une hypothèque
URL : `/hypotheques/new`  
Rôle requis : GESTIONNAIRE_GARANTIES ou ADMIN

Champs obligatoires :
- Code client, Nom client
- Numéro de prêt *(unique)*
- Numéro de titre foncier
- Nature du bien : TERRAIN_NU / VILLA / IMMEUBLE_RAPPORT / USINE / BUREAU
- Ville, Quartier *(optionnel)*, Lot *(optionnel)*, Îlot *(optionnel)*
- Zone géographique : ZONE_A / ZONE_B / ZONE_C
- Statut d'occupation : LIBRE / OCCUPE_PROPRIETAIRE / LOUE_AVEC_BAIL
- Valeur d'expertise initiale (FCFA)
- Date d'expertise
- Montant d'inscription (FCFA)
- Rang de l'hypothèque (défaut : 1)
- Date de péremption de l'inscription
- Solde du prêt (FCFA)
- **Pièce jointe PDF** de l'expertise *(optionnel)*

Le backend calcule automatiquement VNC, LTV et décotes à la création.

### 3.3 Fiche détail d'une hypothèque
URL : `/hypotheques/[id]`

- Toutes les données saisies
- **Calculs réglementaires affichés** :
  - Décote zone (20% / 30% / 45%)
  - Décote ancienneté (0% / 10% / 100%)
  - Décote occupation (0% / 5% / 15%)
  - Décote totale (cumulée, plafonnée à 100%)
  - VNC = valeurExpertise × (1 - décoteTotale/100)
  - LTV = (soldePrêt / VNC) × 100
- Alertes associées (avec statut lu/non lu)
- **Historique des réévaluations** (tableau chronologique)
- Lien de téléchargement du document PDF si présent

### 3.4 Modification d'une hypothèque
URL : `/hypotheques/[id]/edit`  
Rôle requis : GESTIONNAIRE_GARANTIES ou ADMIN

- Modification de tous les champs
- Possibilité de remplacer le document PDF
- Les calculs sont recalculés automatiquement

### 3.5 Réévaluation
Endpoint : `POST /api/hypotheques/:id/reevaluer`  
Rôle requis : GESTIONNAIRE_GARANTIES ou ADMIN

- Mise à jour sélective : nouvelle valeur, nouvelle date, nouvelle zone, nouveau statut d'occupation
- Champ motif de la réévaluation
- **Création automatique d'un enregistrement dans l'historique** avec tous les paramètres calculés (décotes, VNC, LTV, auteur, date)

### 3.6 Suppression d'une hypothèque
Rôle requis : ADMIN uniquement  
Suppression en cascade (historique + alertes associés supprimés)

### 3.7 Import CSV en masse
Endpoint : `POST /api/hypotheques/import`  
Rôle requis : GESTIONNAIRE_GARANTIES ou ADMIN

- Téléchargement d'un fichier CSV pour créer plusieurs hypothèques en une opération

### 3.8 Téléchargement du document
Endpoint : `GET /api/hypotheques/:id/document`  
Téléchargement du PDF d'expertise associé à une hypothèque

---

## 4. Alertes

URL : `/alertes`  
Endpoint : `GET /api/dashboard/alertes`

### 4.1 Types d'alertes générées automatiquement

| Type | Déclencheur | Sévérité |
|------|-------------|----------|
| `EXPERTISE_EXPIREE` | Expertise > 5 ans | MEDIUM |
| `EXPERTISE_BIENTOT_EXPIREE` | Expertise entre 3 et 5 ans | MEDIUM |
| `INSCRIPTION_PERIMEE` | Date péremption dépassée ou < 6 mois | HIGH |
| `SHORTFALL` | Solde prêt > VNC | CRITICAL |

### 4.2 Gestion des alertes
- **Filtres** : par type, par statut (LU / NON_LU)
- **Marquer une alerte comme lue** : `PUT /api/dashboard/alertes/:id/lue`
- **Marquer toutes les alertes comme lues** : `PUT /api/dashboard/alertes/lue-toutes`
- Génération automatique des alertes au démarrage du serveur + toutes les 24h

---

## 5. Reporting Annuel

URL : `/reporting`

### 5.1 Rapport annuel
Endpoint : `GET /api/reporting/annuel`

Données par hypothèque :
- Toutes les informations de base
- Décotes détaillées (zone, ancienneté, occupation, totale)
- VNC et LTV calculés
- Âge de l'expertise (en mois ou années)
- Statut : OK / SHORTFALL / EXPERTISE_EXPIREE / RISQUE_ELEVE / ALERTE

Statistiques de synthèse :
- Total hypothèques, VNC totale, solde total, LTV moyen
- Répartition par zone (A/B/C)
- Répartition par statut

### 5.2 Export CSV
Endpoint : `GET /api/reporting/annuel/export`

- Fichier CSV avec BOM UTF-8 (compatible Excel)
- Nom du fichier : `rapport-hypotheques-{année}.csv`
- Séparateur point-virgule
- Colonnes : Code Client, Nom Client, N° Prêt, Titre Foncier, Nature, Ville, Zone, Statut Occupation, Valeur Expertise, Date Expertise, Âge Expertise, Décotes ×4, VNC, Solde Prêt, LTV, Montant Inscription, Rang, Date Péremption, Statut, Alertes

---

## 6. Administration des utilisateurs

URL : `/admin/users`  
Rôle requis : ADMIN uniquement

### 6.1 Liste des utilisateurs
- Tableau de tous les comptes avec : prénom, nom, email, rôle, date de création

### 6.2 Création d'un utilisateur
- Champs : email, mot de passe (min 6 car.), nom, prénom, rôle
- Rôles disponibles : ADMIN / GESTIONNAIRE_GARANTIES / RESPONSABLE_RISQUES
- Vérification de l'unicité de l'email
- Hachage bcrypt du mot de passe

### 6.3 Modification d'un utilisateur
- Modification partielle (champs optionnels)
- Changement de mot de passe possible
- Vérification de l'email si modifié

### 6.4 Suppression d'un utilisateur
- Impossible de supprimer son propre compte
- Suppression définitive

---

## 7. Moteur de calcul réglementaire (Circulaire 04-2017)

Toutes les hypothèques sont enrichies à chaque lecture avec les calculs suivants :

### Décote Zone Géographique
| Zone | Décote |
|------|--------|
| ZONE_A (Urbaine prime) | 20% |
| ZONE_B (Standard) | 30% |
| ZONE_C (Rurale) | 45% |

### Décote Ancienneté de l'expertise
| Âge | Décote |
|-----|--------|
| 0 – 3 ans | 0% |
| 3 – 5 ans | 10% |
| > 5 ans | 100% (valeur nulle) |

### Décote Occupation
| Statut | Décote |
|--------|--------|
| LIBRE / TERRAIN_NU | 0% |
| OCCUPE_PROPRIETAIRE | 5% |
| LOUE_AVEC_BAIL | 15% |

### Formules
```
Décote totale  = min(décoteZone + décoteAncienneté + décoteOccupation, 100%)
VNC            = valeurExpertise × (1 - décoteTotale / 100)
LTV            = (soldePrêt / VNC) × 100
Shortfall      = soldePrêt > VNC
```

---

## 8. Sécurité

- **JWT** avec secret configurable via `JWT_SECRET` (env)
- **httpOnly cookie** — token inaccessible au JavaScript
- **Helmet** — headers HTTP sécurisés
- **CORS** restreint à `http://localhost:3000` (configurable via `FRONTEND_URL`)
- **Validation des entrées** avec `express-validator` sur toutes les routes POST/PUT
- **Upload limité** aux types PDF/CSV avec Multer
- Mots de passe hachés avec **bcrypt** (10 rounds)
- Protection contre la suppression de son propre compte admin

---

## 9. Architecture technique

```
Frontend (Next.js 16 / React 19)     Backend (Node.js / Express / TypeScript)
port 3000                             port 3001
│                                     │
├── /login                            ├── POST   /api/auth/login
├── /dashboard                        ├── POST   /api/auth/logout
├── /hypotheques                      ├── GET    /api/auth/me
├── /hypotheques/new                  │
├── /hypotheques/[id]                 ├── GET    /api/hypotheques
├── /hypotheques/[id]/edit            ├── POST   /api/hypotheques
├── /alertes                          ├── GET    /api/hypotheques/:id
├── /reporting                        ├── PUT    /api/hypotheques/:id
└── /admin/users                      ├── DELETE /api/hypotheques/:id
                                      ├── GET    /api/hypotheques/:id/historique
Proxy Next.js :                       ├── POST   /api/hypotheques/:id/reevaluer
/api/* → localhost:3001/api/*         ├── GET    /api/hypotheques/:id/document
                                      ├── POST   /api/hypotheques/import
Base de données : SQLite              │
(backend/prisma/hypotheque.db)        ├── GET    /api/dashboard/stats
                                      ├── GET    /api/dashboard/alertes
Modèles :                             ├── GET    /api/dashboard/repartition-zone
- User                                ├── GET    /api/dashboard/evolution-vnc
- Hypotheque                          ├── PUT    /api/dashboard/alertes/:id/lue
- HistoriqueValeur                    ├── PUT    /api/dashboard/alertes/lue-toutes
- Alert                               │
                                      ├── GET    /api/reporting/annuel
                                      ├── GET    /api/reporting/annuel/export
                                      │
                                      ├── GET    /api/users
                                      ├── POST   /api/users
                                      ├── PUT    /api/users/:id
                                      └── DELETE /api/users/:id
```
