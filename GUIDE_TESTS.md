# SGH — Guide de Tests Complet
## Tous les scénarios de test de l'application

> Prérequis : backend sur port 3001, frontend sur port 3000, DB seedée
> Comptes de test :
> - Admin : `admin@banque.sn` / `Admin@1234`
> - Gestionnaire : `gestionnaire@banque.sn` / `Gest@1234`
> - Risques : `risques@banque.sn` / `Risques@1234`

---

## MODULE 1 — AUTHENTIFICATION

### TEST 1.1 — Connexion avec succès (Admin)
**Étapes :**
1. Ouvrir `http://localhost:3000`
2. Entrer email : `admin@banque.sn`, mot de passe : `Admin@1234`
3. Cliquer "Se connecter"

**Résultat attendu :** Redirection vers `/dashboard`, dashboard visible

---

### TEST 1.2 — Connexion avec succès (Gestionnaire)
**Étapes :**
1. Entrer email : `gestionnaire@banque.sn`, mot de passe : `Gest@1234`
2. Cliquer "Se connecter"

**Résultat attendu :** Redirection vers `/dashboard`

---

### TEST 1.3 — Connexion avec succès (Responsable Risques)
**Étapes :**
1. Entrer email : `risques@banque.sn`, mot de passe : `Risques@1234`

**Résultat attendu :** Redirection vers `/dashboard`

---

### TEST 1.4 — Connexion avec mauvais mot de passe
**Étapes :**
1. Entrer email : `admin@banque.sn`, mot de passe : `mauvais`
2. Cliquer "Se connecter"

**Résultat attendu :** Message d'erreur "Email ou mot de passe incorrect", pas de redirection

---

### TEST 1.5 — Connexion avec email inexistant
**Étapes :**
1. Entrer email : `inexistant@banque.sn`, mot de passe : `quelconque`

**Résultat attendu :** Message d'erreur, pas de redirection

---

### TEST 1.6 — Formulaire vide
**Étapes :**
1. Laisser les champs vides, cliquer "Se connecter"

**Résultat attendu :** Message "Veuillez remplir tous les champs"

---

### TEST 1.7 — Déconnexion
**Étapes :**
1. Être connecté
2. Cliquer sur le bouton de déconnexion dans le menu

**Résultat attendu :** Redirection vers `/login`, cookie supprimé

---

### TEST 1.8 — Accès direct sans être connecté
**Étapes :**
1. Sans être connecté, aller sur `http://localhost:3000/dashboard`

**Résultat attendu :** Redirection automatique vers `/login`

---

### TEST 1.9 — Expiration de session (API)
```bash
curl -X GET http://localhost:3001/api/hypotheques \
  -H "Authorization: Bearer token_invalide"
```
**Résultat attendu :** HTTP 401 `{"error": "Invalid or expired token"}`

---

## MODULE 2 — DASHBOARD

### TEST 2.1 — Chargement des KPIs
**Étapes :**
1. Se connecter en tant qu'admin
2. Aller sur `/dashboard`

**Résultat attendu :** Les 6 cartes KPI affichent des valeurs numériques (pas "0" ou "NaN") :
- Total hypothèques ≥ 1
- VNC totale > 0
- Alertes actives (nombre)
- LTV moyen (pourcentage)
- Shortfalls (nombre)
- Encours total prêts

---

### TEST 2.2 — Graphique répartition par zone
**Résultat attendu :** Graphique visible avec des données pour ZONE_A, ZONE_B, ZONE_C

---

### TEST 2.3 — Graphique évolution VNC 12 mois
**Résultat attendu :** Courbe avec au moins 1 point de données (mois courant)

---

### TEST 2.4 — Top 5 shortfalls
**Résultat attendu :** Tableau des hypothèques en shortfall (si existantes) trié par LTV décroissant

---

### TEST 2.5 — Alertes récentes
**Résultat attendu :** Liste des 5 dernières alertes non lues avec badge de sévérité (CRITICAL/HIGH/MEDIUM)

---

### TEST 2.6 — API stats directe
```bash
# Récupérer d'abord un token
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@banque.sn","password":"Admin@1234"}' | python -m json.tool
```
Copier le token, puis :
```bash
curl -X GET http://localhost:3001/api/dashboard/stats \
  -H "Authorization: Bearer <TOKEN>"
```
**Résultat attendu :** JSON avec `totalHypotheques`, `vncTotale`, `repartitionZone`, `evolutionVNC`, `topShortfall`

---

## MODULE 3 — LISTE DES HYPOTHÈQUES

### TEST 3.1 — Affichage de la liste
**Étapes :**
1. Aller sur `/hypotheques`

**Résultat attendu :** Tableau paginé avec au moins une hypothèque, colonnes : client, n° prêt, zone, VNC, LTV, statut

---

### TEST 3.2 — Filtre par nom client
**Étapes :**
1. Saisir un nom partiel dans le champ de recherche
2. Attendre le filtrage

**Résultat attendu :** Seules les hypothèques dont le nom ou code client contient la saisie sont affichées

---

### TEST 3.3 — Filtre par zone géographique
**Étapes :**
1. Sélectionner "ZONE_A" dans le filtre zone

**Résultat attendu :** Seules les hypothèques en ZONE_A sont visibles

---

### TEST 3.4 — Pagination
**Étapes :**
1. Si > 20 hypothèques, aller à la page 2

**Résultat attendu :** Les hypothèques suivantes s'affichent, pas les mêmes que page 1

---

### TEST 3.5 — API liste avec filtres
```bash
curl "http://localhost:3001/api/hypotheques?zone=ZONE_A&page=1&limit=5" \
  -H "Authorization: Bearer <TOKEN>"
```
**Résultat attendu :** JSON avec `data` (tableau) et `pagination` (`total`, `page`, `limit`, `totalPages`)

---

## MODULE 4 — CRÉATION D'UNE HYPOTHÈQUE

### TEST 4.1 — Création valide (cas nominal)
**Rôle requis : Gestionnaire ou Admin**

**Étapes :**
1. Aller sur `/hypotheques/new`
2. Remplir tous les champs :
   - Code client : `CLI-TEST-001`
   - Nom client : `Mamadou Diallo`
   - Numéro prêt : `PRET-TEST-2026-001` (unique)
   - Numéro titre foncier : `TF-DAKAR-001`
   - Nature du bien : `VILLA`
   - Ville : `Dakar`
   - Zone : `ZONE_A`
   - Statut occupation : `LIBRE`
   - Valeur expertise : `50000000`
   - Date expertise : date du jour
   - Montant inscription : `45000000`
   - Rang : `1`
   - Date péremption : date dans 10 ans
   - Solde prêt : `30000000`
3. Cliquer "Créer"

**Résultat attendu :**
- Redirection vers la fiche de l'hypothèque créée
- VNC calculée = 50 000 000 × (1 - 20%/100) = 40 000 000 FCFA
- LTV = (30 000 000 / 40 000 000) × 100 = 75%
- Statut : OK

---

### TEST 4.2 — Vérification des décotes ZONE_B, expertise 4 ans, LOUE
**Étapes :**
1. Créer une hypothèque avec :
   - Zone : `ZONE_B`
   - Date expertise : date de 4 ans en arrière
   - Statut occupation : `LOUE_AVEC_BAIL`
   - Valeur expertise : `10 000 000`
   - Solde prêt : `8 000 000`

**Résultat attendu :**
- Décote zone = 30%
- Décote ancienneté = 10% (entre 3 et 5 ans)
- Décote occupation = 15%
- Décote totale = 55%
- VNC = 10 000 000 × 0.45 = 4 500 000 FCFA
- LTV = (8 000 000 / 4 500 000) × 100 = 177.8% → **SHORTFALL**

---

### TEST 4.3 — Expertise obsolète (> 5 ans)
**Étapes :**
1. Créer avec date expertise de 6 ans en arrière
2. Zone ZONE_C, valeur 10 000 000, solde 1 000 000

**Résultat attendu :**
- Décote ancienneté = 100%
- Décote totale = min(45 + 100 + X, 100) = 100%
- VNC = 0
- Statut : EXPERTISE_OBSOLETE

---

### TEST 4.4 — Numéro de prêt déjà existant
**Étapes :**
1. Créer une hypothèque avec un numéro de prêt déjà utilisé

**Résultat attendu :** Erreur HTTP 409 "Numéro de prêt already exists"

---

### TEST 4.5 — Champs obligatoires manquants
**Étapes :**
1. Soumettre le formulaire avec le champ "Code client" vide

**Résultat attendu :** Validation front-end bloque la soumission, message d'erreur visible

---

### TEST 4.6 — Accès refusé (Rôle RESPONSABLE_RISQUES)
**Étapes :**
1. Se connecter en tant que `risques@banque.sn`
2. Essayer d'accéder à `/hypotheques/new`

**Résultat attendu :** Accès refusé ou bouton "Créer" absent

---

### TEST 4.7 — Création via API directe
```bash
curl -X POST http://localhost:3001/api/hypotheques \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "codeClient": "CLI-API-001",
    "nomClient": "Test API Client",
    "numeroPret": "PRET-API-2026-001",
    "numeroTitreFoncier": "TF-API-001",
    "natureBien": "BUREAU",
    "ville": "Abidjan",
    "zoneGeographique": "ZONE_B",
    "statutOccupation": "OCCUPE_PROPRIETAIRE",
    "valeurExpertiseInitiale": 20000000,
    "dateExpertise": "2024-01-15T00:00:00.000Z",
    "montantInscription": 18000000,
    "rangHypotheque": 1,
    "datePeremptionInscription": "2030-01-15T00:00:00.000Z",
    "soldePret": 15000000
  }'
```
**Résultat attendu :** HTTP 201 avec l'objet hypothèque enrichi (vnc, ltv, statut calculés)

---

## MODULE 5 — FICHE DÉTAIL HYPOTHÈQUE

### TEST 5.1 — Consultation de la fiche
**Étapes :**
1. Dans la liste, cliquer sur une hypothèque

**Résultat attendu :**
- Toutes les données affichées
- Section calculs avec décotes détaillées
- VNC et LTV corrects
- Historique des réévaluations visible
- Alertes actives visibles

---

### TEST 5.2 — Téléchargement du document PDF
**Étapes :**
1. Sur une fiche avec PDF joint, cliquer "Télécharger le document"

**Résultat attendu :** Le PDF se télécharge

---

### TEST 5.3 — API détail
```bash
curl http://localhost:3001/api/hypotheques/1 \
  -H "Authorization: Bearer <TOKEN>"
```
**Résultat attendu :** JSON avec champs `vnc`, `ltv`, `statut`, `decoteZone`, `decoteAnciennete`, `decoteOccupation`, `decoteTotale`, `alertes`, `historique`

---

## MODULE 6 — MODIFICATION

### TEST 6.1 — Modification d'un champ
**Étapes :**
1. Aller sur `/hypotheques/[id]/edit`
2. Modifier le solde du prêt
3. Enregistrer

**Résultat attendu :** VNC et LTV recalculés, statut mis à jour

---

### TEST 6.2 — API modification
```bash
curl -X PUT http://localhost:3001/api/hypotheques/1 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"soldePret": 999999}'
```
**Résultat attendu :** HTTP 200 avec hypothèque mise à jour et calculs recalculés

---

### TEST 6.3 — Hypothèque inexistante
```bash
curl -X PUT http://localhost:3001/api/hypotheques/99999 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"soldePret": 1}'
```
**Résultat attendu :** HTTP 404 `{"error": "Hypothèque not found"}`

---

## MODULE 7 — RÉÉVALUATION

### TEST 7.1 — Réévaluation avec nouvelle valeur
**Étapes :**
1. Sur la fiche d'une hypothèque
2. Cliquer "Réévaluer"
3. Saisir nouvelle valeur d'expertise et motif
4. Valider

**Résultat attendu :**
- Nouvelle VNC et LTV calculés
- Un nouvel enregistrement apparaît dans l'historique avec : date, ancienne/nouvelle valeur, décotes, auteur, motif

---

### TEST 7.2 — API réévaluation
```bash
curl -X POST http://localhost:3001/api/hypotheques/1/reevaluer \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "nouvelleValeur": 60000000,
    "nouvelleDate": "2026-08-18T00:00:00.000Z",
    "motif": "Réévaluation annuelle réglementaire"
  }'
```
**Résultat attendu :** HTTP 200, historique créé

---

### TEST 7.3 — Historique
```bash
curl http://localhost:3001/api/hypotheques/1/historique \
  -H "Authorization: Bearer <TOKEN>"
```
**Résultat attendu :** Tableau chronologique avec tous les champs calculés de chaque réévaluation

---

## MODULE 8 — SUPPRESSION

### TEST 8.1 — Suppression par Admin
```bash
curl -X DELETE http://localhost:3001/api/hypotheques/1 \
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```
**Résultat attendu :** HTTP 200 `{"message": "Hypothèque deleted"}`, historique et alertes supprimés en cascade

---

### TEST 8.2 — Suppression refusée (non Admin)
```bash
curl -X DELETE http://localhost:3001/api/hypotheques/2 \
  -H "Authorization: Bearer <TOKEN_GESTIONNAIRE>"
```
**Résultat attendu :** HTTP 403 `{"error": "Insufficient permissions"}`

---

## MODULE 9 — ALERTES

### TEST 9.1 — Consultation des alertes
**Étapes :**
1. Aller sur `/alertes`

**Résultat attendu :** Liste des alertes avec type, message, sévérité, hypothèque concernée

---

### TEST 9.2 — Filtre par type d'alerte
**Étapes :**
1. Filtrer par `SHORTFALL`

**Résultat attendu :** Seules les alertes de type SHORTFALL visibles

---

### TEST 9.3 — Marquer une alerte comme lue
**Étapes :**
1. Cliquer sur "Marquer comme lue" sur une alerte

**Résultat attendu :** L'alerte passe en statut "LU", disparaît du compteur

---

### TEST 9.4 — Marquer toutes comme lues
**Étapes :**
1. Cliquer "Tout marquer comme lu"

**Résultat attendu :** Toutes les alertes passent en LU, compteur = 0

---

### TEST 9.5 — API alertes avec filtres
```bash
curl "http://localhost:3001/api/dashboard/alertes?type=SHORTFALL&statut=NON_LU" \
  -H "Authorization: Bearer <TOKEN>"
```
**Résultat attendu :** Tableau d'alertes filtrées avec `statut`, `severite`, info hypothèque

---

### TEST 9.6 — API marquer une alerte lue
```bash
curl -X PUT http://localhost:3001/api/dashboard/alertes/1/lue \
  -H "Authorization: Bearer <TOKEN>"
```
**Résultat attendu :** HTTP 200 `{"message": "Alert marked as read"}`

---

### TEST 9.7 — API marquer toutes lues
```bash
curl -X PUT http://localhost:3001/api/dashboard/alertes/lue-toutes \
  -H "Authorization: Bearer <TOKEN>"
```
**Résultat attendu :** HTTP 200 `{"message": "All alerts marked as read"}`

---

## MODULE 10 — REPORTING

### TEST 10.1 — Rapport annuel UI
**Étapes :**
1. Aller sur `/reporting`

**Résultat attendu :**
- Tableau avec toutes les hypothèques
- Colonnes : décotes, VNC, LTV, statut, alertes
- Statistiques de synthèse affichées

---

### TEST 10.2 — Export CSV
**Étapes :**
1. Sur la page `/reporting`, cliquer "Exporter CSV"

**Résultat attendu :**
- Fichier `rapport-hypotheques-2026.csv` téléchargé
- Ouvrir dans Excel : colonnes lisibles, valeurs correctes, pas d'erreur de décodage

---

### TEST 10.3 — API rapport annuel
```bash
curl http://localhost:3001/api/reporting/annuel \
  -H "Authorization: Bearer <TOKEN>"
```
**Résultat attendu :** JSON avec `summary` (stats de synthèse) et `data` (tableau complet)

---

### TEST 10.4 — API export CSV
```bash
curl http://localhost:3001/api/reporting/annuel/export \
  -H "Authorization: Bearer <TOKEN>" \
  -o rapport-test.csv
```
**Résultat attendu :** Fichier CSV téléchargé, header `Content-Type: text/csv`, BOM UTF-8 présent

---

## MODULE 11 — ADMINISTRATION UTILISATEURS

### TEST 11.1 — Liste des utilisateurs (Admin)
**Étapes :**
1. Connecté en admin, aller sur `/admin/users`

**Résultat attendu :** Les 3 comptes démo listés (admin, gestionnaire, risques)

---

### TEST 11.2 — Création d'un utilisateur
**Étapes :**
1. Cliquer "Nouvel utilisateur"
2. Remplir : email `test@banque.sn`, mot de passe `Test@1234`, nom `Test`, prénom `User`, rôle `GESTIONNAIRE_GARANTIES`

**Résultat attendu :** Utilisateur créé, visible dans la liste

---

### TEST 11.3 — Email déjà utilisé
**Étapes :**
1. Créer un utilisateur avec email `admin@banque.sn`

**Résultat attendu :** HTTP 409 "Email already in use"

---

### TEST 11.4 — Modification d'un utilisateur
**Étapes :**
1. Modifier le rôle de l'utilisateur `test@banque.sn` en `RESPONSABLE_RISQUES`

**Résultat attendu :** Rôle mis à jour, visible dans la liste

---

### TEST 11.5 — Suppression d'un utilisateur
**Étapes :**
1. Supprimer l'utilisateur `test@banque.sn`

**Résultat attendu :** Utilisateur supprimé, disparaît de la liste

---

### TEST 11.6 — Suppression de son propre compte (interdit)
```bash
# Trouver son propre id avec /api/auth/me, puis :
curl -X DELETE http://localhost:3001/api/users/<MON_ID> \
  -H "Authorization: Bearer <TOKEN_ADMIN>"
```
**Résultat attendu :** HTTP 400 "Cannot delete your own account"

---

### TEST 11.7 — Accès refusé (non Admin)
```bash
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer <TOKEN_GESTIONNAIRE>"
```
**Résultat attendu :** HTTP 403 "Insufficient permissions"

---

## MODULE 12 — CALCULS RÉGLEMENTAIRES (VÉRIFICATION MANUELLE)

Ces tests vérifient la conformité avec la Circulaire 04-2017.

### TEST 12.1 — Décote minimale (ZONE_A, < 3 ans, LIBRE)
```
Valeur expertise : 10 000 000 FCFA
Zone : ZONE_A → 20%
Ancienneté : 1 an → 0%
Occupation : LIBRE → 0%
Décote totale = 20%
VNC attendue = 10 000 000 × 0.80 = 8 000 000 FCFA
```

### TEST 12.2 — Décote intermédiaire (ZONE_B, 4 ans, OCCUPE_PROPRIETAIRE)
```
Valeur expertise : 10 000 000 FCFA
Zone : ZONE_B → 30%
Ancienneté : 4 ans → 10%
Occupation : OCCUPE_PROPRIETAIRE → 5%
Décote totale = 45%
VNC attendue = 10 000 000 × 0.55 = 5 500 000 FCFA
```

### TEST 12.3 — Décote maximale (ZONE_C, > 5 ans, LOUE_AVEC_BAIL)
```
Valeur expertise : 10 000 000 FCFA
Zone : ZONE_C → 45%
Ancienneté : 6 ans → 100%
Occupation : LOUE_AVEC_BAIL → 15%
Décote totale = min(45 + 100 + 15, 100) = 100%
VNC attendue = 0 FCFA
Statut : EXPERTISE_OBSOLETE
```

### TEST 12.4 — TERRAIN_NU (décote occupation toujours 0)
```
Nature : TERRAIN_NU, Occupation : LOUE_AVEC_BAIL
Décote occupation attendue = 0% (TERRAIN_NU override)
```

### TEST 12.5 — LTV et shortfall
```
Solde prêt : 9 000 000 FCFA, VNC : 8 000 000 FCFA
LTV attendu = (9 000 000 / 8 000 000) × 100 = 112.5%
Shortfall = true
```

### TEST 12.6 — Plafonnement décote à 100%
```
Zone ZONE_C (45%) + Ancienneté > 5 ans (100%) + LOUE (15%)
Total brut = 160% → plafonné à 100%
VNC = 0
```

---

## MODULE 13 — SANTÉ ET INFRASTRUCTURE

### TEST 13.1 — Health check backend
```bash
curl http://localhost:3001/api/health
```
**Résultat attendu :** `{"status":"ok","timestamp":"...","version":"1.0.0"}`

---

### TEST 13.2 — Route inexistante
```bash
curl http://localhost:3001/api/inexistant
```
**Résultat attendu :** HTTP 404 `{"error": "Route not found"}`

---

### TEST 13.3 — Sans authentification
```bash
curl http://localhost:3001/api/hypotheques
```
**Résultat attendu :** HTTP 401 `{"error": "Authentication required"}`

---

### TEST 13.4 — Vérifier que le proxy frontend fonctionne
```bash
# Via le frontend (port 3000), pas le backend directement
curl http://localhost:3000/api/health
```
**Résultat attendu :** Même réponse que le direct sur 3001 (proxy fonctionne)

---

## RÉCAPITULATIF DES CAS LIMITES À NE PAS OUBLIER

| Cas limite | Comportement attendu |
|------------|---------------------|
| Token expiré | HTTP 401 |
| Rôle insuffisant | HTTP 403 |
| Ressource inexistante | HTTP 404 |
| Email dupliqué (user) | HTTP 409 |
| Numéro prêt dupliqué | HTTP 409 |
| Supprimer son propre compte | HTTP 400 |
| VNC = 0 (expertise obsolète) | LTV = 999, statut EXPERTISE_OBSOLETE |
| Décote totale > 100% | Plafonnée à 100%, VNC = 0 |
| Inscription expirée | Alerte INSCRIPTION_PERIMEE générée |
| Solde > VNC | Alerte SHORTFALL générée |
| Terrain nu + statut loué | Décote occupation = 0% |
| Champ obligatoire manquant | HTTP 422 validation error |

---

## COMMANDES UTILES POUR LES TESTS API

### Obtenir un token Admin
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@banque.sn","password":"Admin@1234"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo $TOKEN
```

### Obtenir un token Gestionnaire
```bash
TOKEN_GEST=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gestionnaire@banque.sn","password":"Gest@1234"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['token'])")
```

### Vérifier le profil du token
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Lister toutes les hypothèques
```bash
curl "http://localhost:3001/api/hypotheques?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Réinitialiser la base de données (si nécessaire)
```powershell
cd C:\Users\ibrahim.coulibaly\Hypotheque\backend
npx prisma migrate reset --force
npx prisma db seed
```
