# SIGGHY
## Présentation Complète des Fonctionnalités par Profil Utilisateur

**Établissement :** Banque ICO  
**Application :** https://sgh-frontend.vercel.app  
**Référence réglementaire :** Circulaire BCEAO n°04-2017  
**Version :** SGH v2.0 — Août 2026

---

## INTRODUCTION

Le SGH (SIGGHY) est une application web sécurisée développée pour assurer la conformité de la Banque ICO avec la Circulaire n°04-2017 de la BCEAO, relative à la gestion des garanties hypothécaires dans les établissements de crédit de l'UEMOA.

L'application est accesICOle à l'adresse : **https://sgh-frontend.vercel.app**

Elle repose sur un système de contrôle d'accès basé sur les rôles (RBAC), garantissant que chaque utilisateur n'accède qu'aux fonctionnalités correspondant à sa fonction au sein de la banque.

---

## PROFILS UTILISATEURS

L'application compte **5 profils** distincts, chacun avec des droits et des responsabilités spécifiques :

| Profil | Rôle système | Description |
|---|---|---|
| Administrateur | `ADMIN` | Contrôle total du système |
| Gestionnaire Garanties | `GESTIONNAIRE_GARANTIES` | Gestion opérationnelle des dossiers |
| Responsable Risques | `RESPONSABLE_RISQUES` | Supervision et analyse des risques |
| Engagements | `ENGAGEMENTS` | Consultation des dossiers de crédit |
| Audit Interne | `AUDIT_INTERNE` | Contrôle, traçabilité et conformité |

---

## MATRICE DES DROITS

| Fonctionnalité | Admin | Gestionnaire | Resp. Risques | Engagements | Audit |
|---|:---:|:---:|:---:|:---:|:---:|
| Tableau de bord | ✓ | ✓ | ✓ | ✓ | ✓ |
| Consulter les hypothèques | ✓ | ✓ | ✓ | ✓ | ✓ |
| Créer une hypothèque | ✓ | ✓ | — | — | — |
| Modifier une hypothèque | ✓ | ✓ | — | — | — |
| Supprimer une hypothèque | ✓ | — | — | — | — |
| Réévaluer une garantie | ✓ | ✓ | — | — | — |
| Revaloriser par indice | ✓ | ✓ | — | — | — |
| Consulter l'historique | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gérer les alertes | ✓ | ✓ | ✓ | — | ✓ |
| Exporter CSV / Excel | ✓ | ✓ | ✓ | — | ✓ |
| Reporting annuel | ✓ | ✓ | ✓ | — | ✓ |
| Gérer les utilisateurs | ✓ | — | — | — | — |
| Configurer le MFA | ✓ | ✓ | ✓ | ✓ | ✓ |
| Simulation & Prévision | ✓ | ✓ | ✓ | — | — |
| Intelligence Artificielle | ✓ | ✓ | ✓ | — | ✓ |

---

# PROFIL 1 : ADMINISTRATEUR

**Compte démo :** admin@banque.sn / Admin@1234  
**Accès :** Toutes les fonctionnalités sans restriction

L'Administrateur est le garant du bon fonctionnement de la plateforme. Il dispose d'un accès total à l'ensemble des modules et est le seul à pouvoir gérer les comptes utilisateurs et supprimer des dossiers.

---

## MODULE 1 — AUTHENTIFICATION

### 1.1 Connexion standard

1. Accéder à https://sgh-frontend.vercel.app
2. Saisir l'adresse email et le mot de passe
3. Cliquer sur **Se connecter**
4. Redirection automatique vers le tableau de bord

### 1.2 Connexion avec double authentification (MFA)

Si le MFA est activé sur le compte :

1. Saisir email + mot de passe → le système demande un code TOTP
2. Ouvrir l'application Google Authenticator (ou équivalent)
3. Saisir le code à 6 chiffres affiché
4. Cliquer sur **Valider** → accès accordé

### 1.3 Déconnexion

- Cliquer sur le menu utilisateur en haut à droite
- Sélectionner **Se déconnecter**
- La session est invalidée côté serveur

---

## MODULE 2 — TABLEAU DE BORD

Le tableau de bord affiche en temps réel les indicateurs clés du portefeuille de garanties hypothécaires.

### Indicateurs disponibles

| Indicateur | Description |
|---|---|
| **Nombre de dossiers** | Total des hypothèques enregistrées |
| **VNC Totale** | Somme des Valeurs Nettes des Garanties (en FCFA) |
| **LTV Moyen** | Ratio moyen Loan-to-Value du portefeuille |
| **Dossiers en Shortfall** | Nombre de dossiers où LTV > 100% |
| **Alertes actives** | Nombre d'alertes non traitées |

### Actions disponibles depuis le tableau de bord

- Accès rapide à la liste des hypothèques
- Accès rapide au module alertes
- Navigation vers le reporting annuel

---

## MODULE 3 — GESTION DES HYPOTHÈQUES

### 3.1 Consulter la liste des dossiers

- Liste paginée de tous les dossiers hypothécaires
- Colonnes : N° TF, Client, Zone, Statut, VNC, LTV, Alertes
- Filtres disponibles :
  - **Recherche** : par nom client, N° prêt, N° TF, ville
  - **Statut** : OK / SHORTFALL / EXPERTISE_EXPIREE
  - **Zone** : Zone A / Zone B / Zone C / Zone Industrielle
  - **Alerte** : filtrer les dossiers avec alertes actives

### 3.2 Créer un nouveau dossier (Admin uniquement avec Gestionnaire)

1. Cliquer sur **+ Nouvelle Hypothèque**
2. Remplir le formulaire :

| Champ | Obligatoire | Description |
|---|:---:|---|
| Code client | Oui | Identifiant interne du client |
| Nom du client | Oui | Nom complet ou raison sociale |
| Numéro de prêt | Oui | Référence du crédit associé |
| N° Titre Foncier | Oui | Référence cadastrale du bien |
| Nature du bien | Oui | Terrain nu, Villa, Immeuble, Usine, Bureau |
| Ville | Oui | Localisation du bien |
| Quartier / Lot / Îlot | Non | Précision de localisation |
| Zone géographique | Oui | Zone A, B, C ou Industrielle |
| Statut d'occupation | Oui | Libre, Occupé propriétaire, Loué avec bail |
| Valeur d'expertise | Oui | Montant en FCFA (> 0) |
| Date d'expertise | Oui | Date de la dernière expertise |
| Montant d'inscription | Oui | Valeur inscrite au registre foncier |
| Date péremption inscription | Oui | Date d'expiration de l'inscription |
| Rang hypothèque | Oui | 1er rang, 2ème rang, 3ème rang |
| Solde prêt | Oui | Encours restant dû (FCFA) |
| Date échéance prêt | Non | Date de fin du contrat de prêt |
| PJ Expertise (PDF) | Non | Document d'expertise en pièce jointe |

3. Cliquer sur **Enregistrer**
4. Le système calcule automatiquement : VNC, LTV, statut, alertes

### 3.3 Modifier un dossier

1. Cliquer sur un dossier dans la liste
2. Cliquer sur **Modifier**
3. Mettre à jour les champs souhaités
4. Cliquer sur **Enregistrer**
5. Une entrée est automatiquement créée dans l'historique avec le motif "Modification système"

### 3.4 Supprimer un dossier (Admin uniquement)

1. Ouvrir le dossier concerné
2. Cliquer sur **Supprimer**
3. Confirmer la suppression dans la boîte de dialogue
4. Le dossier et tout son historique sont supprimés définitivement

---

## MODULE 4 — RÉÉVALUATION DES GARANTIES

### 4.1 Réévaluation manuelle (bisannuelle)

Conformément à l'Art. 3 de la Circulaire 04-2017, chaque garantie doit être réévaluée tous les 2 ans.

**Procédure :**

1. Ouvrir le dossier à réévaluer
2. Cliquer sur le bouton **Réévaluer**
3. Renseigner les nouveaux paramètres (tout champ est optionnel) :
   - Nouvelle valeur d'expertise
   - Nouvelle date d'expertise
   - Nouvelle zone géographique
   - Nouveau statut d'occupation
   - Motif de la réévaluation (texte libre)
4. Cliquer sur **Valider la réévaluation**
5. Le système recalcule automatiquement : VNC, LTV, décotes, statut
6. Une entrée d'historique est créée avec tous les paramètres

### 4.2 Revalorisation par indice (2ème et 3ème rang)

Pour les hypothèques de rang 2 ou 3, la valeur peut être revalorisée par application d'un indice de revalorisation.

**Procédure :**

1. Ouvrir le dossier (rang 2 ou 3)
2. Cliquer sur **Revaloriser**
3. Saisir l'indice de revalorisation en pourcentage (ex : 5 pour +5%)
4. Saisir un motif (ex : "Indice BCEAO T2-2026")
5. Cliquer sur **Appliquer**
6. Nouvelle valeur = Valeur actuelle × (1 + indice / 100)

---

## MODULE 5 — HISTORIQUE DES RÉÉVALUATIONS

Chaque dossier dispose d'un historique complet de toutes les modifications de valeur.

### Informations affichées dans l'historique

| Colonne | Description |
|---|---|
| Date | Date et heure de la modification |
| Valeur expertise | Montant de l'expertise à cette date |
| Décote zone | Pourcentage de décote géographique |
| Décote ancienneté | Pourcentage selon l'âge de l'expertise |
| Décote occupation | Pourcentage selon le statut d'occupation |
| Décote totale | Cumul des 3 décotes |
| VNC | Valeur nette calculée |
| LTV | Ratio loan-to-value |
| Modifié par | Nom de l'utilisateur ayant effectué la modification |
| Motif | Raison de la modification |

---

## MODULE 6 — ALERTES RÉGLEMENTAIRES

### Types d'alertes

| Type | Description | Seuil de déclenchement |
|---|---|---|
| **SHORTFALL** | LTV > 100% — garantie insuffisante | Immédiat si LTV > 100% |
| **EXPERTISE_EXPIREE** | Expertise de plus de 2 ans | Ancienneté ≥ 2 ans |
| **EXPERTISE_BIENTOT_EXPIREE** | Expertise proche de 2 ans | Entre 21 et 24 mois |
| **EXPERTISE_RENOUVELLEMENT** | Alerte préventive bisannuelle | 3 mois avant les 2 ans |
| **INSCRIPTION_PERIMEE** | Inscription hypothécaire expirée | Date péremption dépassée |

### Actions sur les alertes

- **Marquer comme lue** : cliquer sur l'icône de validation à côté de l'alerte
- **Tout marquer comme lu** : bouton global en haut de la liste
- **Filtrer** : par type d'alerte, par statut (lue / non lue)

> Les alertes sont régénérées automatiquement chaque jour. Une alerte marquée comme lue peut réapparaître si la situation persiste.

---

## MODULE 7 — REPORTING ET EXPORTS

### 7.1 Rapport annuel

AccesICOle via le menu **Reporting**, le rapport annuel présente :

- Synthèse du portefeuille (VNC totale, LTV moyen, taux de shortfall)
- Tableau détaillé de tous les dossiers avec calculs
- Répartition par zone géographique
- Évolution annuelle des indicateurs

### 7.2 Export CSV

- Cliquer sur **Exporter CSV** dans la page Hypothèques ou Reporting
- Fichier téléchargeable immédiatement
- Contient tous les champs calculés (VNC, LTV, statut)

### 7.3 Export Excel

- Cliquer sur **Exporter Excel** dans la page Hypothèques ou Reporting
- Fichier `.xlsx` formaté avec en-têtes
- Prêt pour analyse dans Microsoft Excel

---

## MODULE 8 — GESTION DES UTILISATEURS (Admin uniquement)

### 8.1 Consulter la liste des utilisateurs

- Nom, Email, Rôle de chaque utilisateur
- Comptes actuellement actifs dans le système

### 8.2 Créer un utilisateur

1. Cliquer sur **+ Nouvel Utilisateur**
2. Remplir : Nom complet, Email, Mot de passe, Rôle
3. Cliquer sur **Créer**

**Règles de mot de passe :** minimum 8 caractères, au moins 1 majuscule, 1 chiffre, 1 caractère spécial

### 8.3 Modifier un utilisateur

1. Cliquer sur **Modifier** à côté du compte
2. Mettre à jour les champs souhaités
3. Laisser le mot de passe vide pour le conserver
4. Cliquer sur **Mettre à jour**

### 8.4 Supprimer un utilisateur

1. Cliquer sur **Supprimer** à côté du compte
2. Confirmer la suppression

> Il est imposICOle de supprimer son propre compte administrateur.

### 8.5 Comptes par défaut du système

| Utilisateur | Email | Mot de passe | Rôle |
|---|---|---|---|
| Mamadou Ndiaye | admin@banque.sn | Admin@1234 | Administrateur |
| Awa Diallo | gestionnaire@banque.sn | Gest@1234 | Gestionnaire Garanties |
| Ibrahima Sy | risques@banque.sn | Risques@1234 | Responsable Risques |
| Seydou Konaté | engagements@banque.sn | Engag@1234 | Engagements |
| Aminata Traoré | audit@banque.sn | Audit@1234 | Audit Interne |

---

## MODULE 9 — PROFIL ET SÉCURITÉ MFA

### 9.1 Accéder à son profil

- Cliquer sur **Mon Profil** dans la barre de navigation latérale

### 9.2 Activer le MFA (double authentification)

1. Dans la page Profil, cliquer sur **Activer le MFA**
2. Scanner le QR code avec Google Authenticator ou une app TOTP compatible
3. Saisir le code à 6 chiffres généré par l'application
4. Cliquer sur **Confirmer** → MFA activé
5. À la prochaine connexion, un code TOTP sera demandé après le mot de passe

### 9.3 Désactiver le MFA

1. Dans la page Profil, cliquer sur **Désactiver le MFA**
2. Confirmer → retour à la connexion simple par mot de passe

---

# PROFIL 2 : GESTIONNAIRE GARANTIES

**Compte démo :** gestionnaire@banque.sn / Gest@1234  
**Accès :** Toutes les fonctionnalités opérationnelles (sauf suppression et gestion utilisateurs)

Le Gestionnaire Garanties est le principal utilisateur opérationnel du système. Il gère au quotidien les dossiers hypothécaires, réalise les réévaluations et traite les alertes.

---

## Fonctionnalités accesICOles

### Authentification
- Connexion standard par email/mot de passe
- Connexion avec MFA si activé sur son compte

### Tableau de bord
- Consultation des KPIs du portefeuille
- Vue des alertes en cours

### Gestion des hypothèques
- **Créer** un nouveau dossier hypothécaire (formulaire complet)
- **Consulter** la liste avec filtres et recherche
- **Modifier** les informations d'un dossier existant
- **Importer** des dossiers en masse via fichier CSV

### Réévaluation des garanties
- Réaliser une **réévaluation manuelle** (nouveaux paramètres + motif)
- Appliquer une **revalorisation par indice** (2ème et 3ème rang)
- Consulter l'**historique complet** des réévaluations

### Gestion des alertes
- Consulter toutes les alertes actives
- **Marquer** une alerte ou toutes les alertes comme lues
- Filtrer par type d'alerte

### Reporting et exports
- Générer le **rapport annuel**
- Exporter en **CSV** et **Excel**

### Profil
- Configurer le **MFA** sur son compte
- Modifier ses informations de profil

---

## Ce que le Gestionnaire NE PEUT PAS faire

- Supprimer un dossier hypothécaire
- Accéder à la gestion des utilisateurs
- Créer, modifier ou supprimer d'autres comptes

---

# PROFIL 3 : RESPONSABLE RISQUES

**Compte démo :** risques@banque.sn / Risques@1234  
**Accès :** Lecture complète, exports, reporting — aucune modification

Le Responsable Risques surveille la qualité du portefeuille de garanties. Il analyse les indicateurs de risque, consulte les alertes et produit les reportings nécessaires à la Direction.

---

## Fonctionnalités accesICOles

### Authentification
- Connexion standard par email/mot de passe
- Connexion avec MFA si activé

### Tableau de bord
- Consultation de tous les KPIs : VNC totale, LTV moyen, nombre de shortfalls, alertes actives
- Analyse de la répartition par zone géographique

### Consultation des hypothèques
- Accès en **lecture seule** à tous les dossiers
- Filtres et recherche disponibles
- Consultation des détails complets de chaque dossier
- Consultation de l'**historique des réévaluations**

### Gestion des alertes
- Consultation de toutes les alertes actives par type
- Marquage des alertes comme lues
- Filtrage par criticité

### Reporting et exports
- Génération du **rapport annuel** complet
- Export en **CSV** et **Excel** pour analyses externes

### Profil
- Activation/désactivation du **MFA**

---

## Ce que le Responsable Risques NE PEUT PAS faire

- Créer, modifier ou supprimer un dossier hypothécaire
- Réévaluer ou revaloriser une garantie
- Gérer les comptes utilisateurs

---

# PROFIL 4 : ENGAGEMENTS

**Compte démo :** engagements@banque.sn / Engag@1234  
**Accès :** Consultation des dossiers uniquement

Le service Engagements intervient dans le processus de mise en place des crédits. Il consulte les garanties hypothécaires pour vérifier leur existence et leur état avant l'octroi de nouveaux prêts.

---

## Fonctionnalités accesICOles

### Authentification
- Connexion standard par email/mot de passe
- Connexion avec MFA si activé

### Tableau de bord
- Consultation des indicateurs globaux du portefeuille

### Consultation des hypothèques
- Accès en **lecture seule** à la liste complète des dossiers
- Utilisation des filtres de recherche (nom client, N° prêt, N° TF, ville)
- Consultation du détail complet d'un dossier :
  - Informations sur le bien (nature, localisation, zone)
  - Valeur d'expertise et date
  - VNC calculée et décotes appliquées
  - LTV et statut (OK / SHORTFALL)
  - Rang de l'hypothèque
  - Solde prêt et date d'échéance
- Consultation de l'**historique des réévaluations**

### Profil
- Activation/désactivation du **MFA**

---

## Ce que le service Engagements NE PEUT PAS faire

- Créer, modifier ou supprimer un dossier
- Réévaluer ou revaloriser une garantie
- Accéder aux alertes
- Exporter les données
- Accéder au reporting annuel
- Gérer les comptes utilisateurs

---

# PROFIL 5 : AUDIT INTERNE

**Compte démo :** audit@banque.sn / Audit@1234  
**Accès :** Lecture complète + historique + exports (contrôle et conformité)

L'Audit Interne assure le contrôle de la conformité réglementaire (Circulaire 04-2017) et vérifie la traçabilité de toutes les opérations effectuées sur les garanties.

---

## Fonctionnalités accesICOles

### Authentification
- Connexion standard par email/mot de passe
- Connexion avec MFA si activé (recommandé pour ce profil)

### Tableau de bord
- Consultation de tous les KPIs du portefeuille
- Vue d'ensemble des risques et alertes

### Consultation des hypothèques
- Accès en **lecture seule** à l'intégralité des dossiers
- Filtres complets de recherche et tri
- Consultation du détail complet de chaque garantie
- Consultation de l'**historique exhaustif** des réévaluations :
  - Qui a effectué chaque modification (traçabilité)
  - Quand (date et heure précises)
  - Quoi (valeurs avant/après)
  - Pourquoi (motif saisi)

### Gestion des alertes
- Consultation de toutes les alertes actives et résolues
- Vérification de la conformité (expertises expirées, inscriptions périmées)
- Marquage des alertes

### Reporting et exports
- Génération du **rapport annuel** (état de conformité Circulaire 04-2017)
- Export **CSV** : données brutes pour audit externe
- Export **Excel** : tableau de bord formaté

### Profil
- Activation/désactivation du **MFA** (fortement recommandé)

---

## Ce que l'Audit Interne NE PEUT PAS faire

- Créer, modifier ou supprimer un dossier hypothécaire
- Réévaluer ou revaloriser une garantie
- Gérer les comptes utilisateurs

---

# FORMULES ET RÈGLES MÉTIER

## Calcul de la VNC (Valeur Nette de la Garantie)

### Grille de décotes — Circulaire 04-2017

**Décote géographique (zone du bien) :**

| Zone | Décote |
|---|---|
| Zone A — Dakar urbain | 20% |
| Zone B — Périphérie urbaine | 30% |
| Zone C — Zone rurale | 45% |
| Zone Industrielle | 40% |

**Décote d'ancienneté (âge de l'expertise) :**

| Ancienneté de l'expertise | Décote |
|---|---|
| 0 à 3 ans | 0% |
| 3 à 5 ans | 10% |
| Plus de 5 ans | 100% (valeur nulle) |

**Décote d'occupation :**

| Statut d'occupation | Décote |
|---|---|
| Libre | 0% |
| Propriétaire occupant | 5% |
| Loué avec bail | 15% |

### Formules

```
Décote totale = min(D_zone + D_ancienneté + D_occupation, 100%)

VNC = Valeur expertise × (1 − Décote totale / 100)

LTV = (Solde prêt / VNC) × 100

Shortfall : si LTV > 100%, la garantie ne couvre pas le prêt
```

### Exemple de calcul

> **Dossier :** Bien en Zone B, expertise de 4 ans, propriétaire occupant  
> **D_zone** = 30% | **D_ancienneté** = 10% | **D_occupation** = 5%  
> **Décote totale** = 45%  
> **Valeur expertise** = 200 000 000 FCFA  
> **VNC** = 200 000 000 × (1 − 0,45) = **110 000 000 FCFA**  
> **Solde prêt** = 130 000 000 FCFA  
> **LTV** = 130 000 000 / 110 000 000 × 100 = **118,2% → SHORTFALL**

---

# FONCTIONNALITÉ 16 — SIMULATION & PRÉVISION

**URL :** `/simulation`  
**Profils autorisés :** Admin, Gestionnaire, Responsable Risques

## Description

Le module Simulation permet de tester des scénarios hypothétiques d'évolution du portefeuille sans modifier les données réelles.

## Fonctionnalités disponibles

### Simulation de réévaluation individuelle
- Sélection d'une hypothèque existante
- Saisie d'une nouvelle valeur d'expertise simulée
- Calcul instantané : VNC simulée, LTV simulé, impact sur le statut (Couvert / Shortfall)
- Affichage de l'écart avec la situation actuelle

### Stress test portefeuille
- Application d'une décote de marché uniforme sur un périmètre choisi
- Paramètre : taux de baisse (ex. : −20 %)
- Résultat : nombre de dossiers basculant en shortfall, VNC totale impactée

> Toutes les simulations sont temporaires et n'affectent pas la base de données réelle.

---

# FONCTIONNALITÉ 17 — INTELLIGENCE ARTIFICIELLE

**URL :** `/ia`  
**Profils autorisés :** Admin, Gestionnaire, Responsable Risques, Audit Interne

## Description

Le module IA fournit des analyses prédictives et des recommandations basées sur les données historiques du portefeuille hypothécaire.

## Fonctionnalités disponibles

### Score de risque automatique
- Calcul d'un score de risque (0–100) pour chaque hypothèque
- Facteurs : ancienneté expertise, évolution LTV, zone géographique, classification crédit

### Détection d'anomalies
- Identification des valeurs d'expertise incohérentes avec la zone
- Détection de LTV anormaux par rapport à des dossiers similaires
- Alerte sur expertises non renouvelées malgré une alerte BCEAO active

### Recommandations priorisées
- **Urgence haute :** réévaluations overdue (> 2 ans)
- **Urgence moyenne :** dossiers proches du seuil de shortfall
- **Surveillance :** dossiers en zone à risque marché

> Les recommandations IA sont des outils d'aide à la décision et ne remplacent pas l'analyse humaine.

---

# GLOSSAIRE

| Terme | Définition |
|---|---|
| **VNC** | Valeur Nette de la Garantie — valeur après application des décotes réglementaires |
| **LTV** | Loan-To-Value — ratio entre le solde du prêt et la VNC |
| **Shortfall** | Situation où le prêt dépasse la valeur de la garantie (LTV > 100%) |
| **Décote** | Abattement appliqué à la valeur d'expertise selon des critères réglementaires |
| **Expertise bisannuelle** | Réévaluation obligatoire du bien tous les 2 ans (Art. 3, Circ. 04-2017) |
| **Revalorisation** | Ajustement de la valeur par application d'un indice (sans nouvelle expertise) |
| **Inscription hypothécaire** | Enregistrement légal de la garantie au registre foncier |
| **MFA / TOTP** | Double authentification par code à usage unique (Google Authenticator) |
| **RBAC** | Role-Based Access Control — contrôle d'accès basé sur les rôles |
| **BCEAO** | Banque Centrale des États de l'Afrique de l'Ouest |

---

*Banque ICO — SGH v2.0*  
*Document généré le 18 août 2026*  
*Référence : SGH-PRES-FONC-2026-001*
