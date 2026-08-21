# Guide Utilisateur — SGH
## SIGGHY
### Banque ICO

---

**Version :** 2.0  
**Date :** 20 août 2026  
**Conformité :** Circulaire BCEAO n°04-2017  
**URL Production :** https://sgh-frontend.vercel.app  
**Contact support :** Direction des Systèmes d'Information — ICO

---

## Table des matières

1. [Introduction](#1-introduction)
2. [Accès et authentification](#2-accès-et-authentification)
3. [Tableau de bord](#3-tableau-de-bord)
4. [Gestion des hypothèques](#4-gestion-des-hypothèques)
5. [Procédure de réévaluation bisannuelle](#5-procédure-de-réévaluation-bisannuelle)
6. [Revalorisation par indice (2ème/3ème rang)](#6-revalorisation-par-indice-2ème3ème-rang)
7. [Historique des réévaluations](#7-historique-des-réévaluations)
8. [Module Alertes](#8-module-alertes)
9. [Reporting et exports](#9-reporting-et-exports)
10. [Gestion des utilisateurs](#10-gestion-des-utilisateurs)
11. [Configuration MFA](#11-configuration-mfa)
12. [Formules et règles métier](#12-formules-et-règles-métier)
13. [Rôles et permissions](#13-rôles-et-permissions)
14. [Module Simulation & Prévision](#14-module-simulation--prévision)
15. [Module Intelligence Artificielle](#15-module-intelligence-artificielle)
16. [Glossaire](#16-glossaire)

---

## 1. Introduction

Le **SIGGHY** est une application web sécurisée développée pour la **Banque ICO** afin de centraliser et automatiser la gestion des garanties hypothécaires dans le strict respect de la **Circulaire BCEAO n°04-2017** relative à la prise en compte des sûretés réelles dans le calcul des provisions.

### 1.1 Objectifs du système

- Assurer la **réévaluation bisannuelle obligatoire** des garanties hypothécaires conformément à la réglementation BCEAO
- Calculer automatiquement la **Valeur Nette Comptable (VNC)** des biens immobiliers après application des décotes réglementaires
- Identifier et signaler les situations de **shortfall** (insuffisance de couverture) en temps réel
- Produire des **reportings réglementaires** fiables et auditables
- Garantir une **traçabilité complète** de toutes les opérations de réévaluation

### 1.2 Périmètre fonctionnel

Le SGH couvre les fonctionnalités suivantes :
- Authentification sécurisée avec authentification multi-facteurs (MFA) optionnelle
- Gestion du cycle de vie complet des garanties hypothécaires
- Réévaluation bisannuelle et revalorisation par indice
- Système d'alertes automatiques sur les échéances et anomalies
- Génération de rapports et exports réglementaires
- Administration des comptes et des droits d'accès

---

## 2. Accès et authentification

### 2.1 Connexion à l'application

Pour accéder au SGH, ouvrir un navigateur web (Chrome, Firefox, Edge — versions récentes recommandées) et saisir l'URL :

```
https://sgh-frontend.vercel.app
```

La page de connexion s'affiche avec deux champs de saisie.

**Procédure de connexion :**

1. Saisir l'adresse e-mail professionnelle dans le champ **Identifiant**
2. Saisir le mot de passe dans le champ **Mot de passe**
3. Cliquer sur le bouton **Se connecter**
4. Si le MFA est activé sur le compte, saisir le code à 6 chiffres généré par l'application d'authentification (Google Authenticator ou équivalent)
5. L'application redirige automatiquement vers le tableau de bord

> **Note :** La session expire après 30 minutes d'inactivité. L'utilisateur est alors redirigé vers la page de connexion. Les données non sauvegardées peuvent être perdues.

> **Avertissement :** En cas de trois tentatives de connexion échouées successives, le compte est temporairement bloqué. Contacter l'administrateur du système pour déblocage.

### 2.2 Comptes de démonstration

Les comptes suivants sont disponibles pour l'environnement de démonstration :

| Profil | Identifiant | Mot de passe | Rôle |
|---|---|---|---|
| Administrateur | admin@banque.sn | Admin@1234 | Administration complète |
| Gestionnaire Garanties | gestionnaire@banque.sn | Gest@1234 | Gestion des hypothèques |
| Responsable Risques | risques@banque.sn | Risques@1234 | Supervision et validation |
| Engagements | engagements@banque.sn | Engag@1234 | Consultation et reporting |
| Audit Interne | audit@banque.sn | Audit@1234 | Audit et traçabilité |

> **Avertissement :** Ces comptes sont strictement réservés à l'environnement de démonstration. Ne jamais utiliser ces identifiants en production.

### 2.3 Réinitialisation du mot de passe

En cas d'oubli du mot de passe, cliquer sur le lien **Mot de passe oublié ?** sur la page de connexion. Un e-mail de réinitialisation est envoyé à l'adresse professionnelle enregistrée. Le lien de réinitialisation est valide pendant 24 heures.

---

## 3. Tableau de bord

Le tableau de bord constitue la page d'accueil du SGH après connexion. Il offre une vue synthétique et en temps réel de l'ensemble du portefeuille de garanties hypothécaires.

### 3.1 Indicateurs clés de performance (KPIs)

Quatre indicateurs principaux sont affichés sous forme de tuiles en haut de la page :

| KPI | Description |
|---|---|
| **VNC Totale** | Somme des Valeurs Nettes Comptables de toutes les garanties actives, exprimée en FCFA |
| **LTV Moyen** | Ratio Loan-to-Value moyen du portefeuille, exprimé en pourcentage |
| **Shortfalls actifs** | Nombre de garanties dont le LTV dépasse 100 % (couverture insuffisante) |
| **Alertes actives** | Nombre total d'alertes non traitées nécessitant une action |

### 3.2 Graphiques et visualisations

Sous les KPIs, le tableau de bord présente :

- **Répartition par zone géographique** : graphique camembert illustrant la distribution des garanties par zone (A, B, C, Industrielle)
- **Distribution des LTV** : histogramme représentant la concentration des ratios LTV par tranche (0-50%, 50-75%, 75-100%, >100%)
- **Évolution mensuelle** : courbe de tendance de la VNC totale sur les 12 derniers mois
- **Alertes par type** : graphique en barres résumant les alertes par catégorie

### 3.3 Raccourcis d'action rapide

Le tableau de bord propose des boutons d'accès rapide aux fonctions les plus utilisées :
- **Nouvelle hypothèque** — création d'une garantie
- **Voir les alertes** — accès direct au module alertes
- **Exporter le rapport** — génération du rapport mensuel

---

## 4. Gestion des hypothèques

### 4.1 Liste des hypothèques

AccesICOle via le menu principal **Hypothèques**, cette page affiche l'ensemble des garanties enregistrées sous forme de tableau paginé.

**Colonnes affichées :**

| Colonne | Description |
|---|---|
| Référence | Identifiant unique de la garantie |
| Client / Débiteur | Nom du titulaire du prêt garanti |
| Bien immobilier | Adresse ou description du bien |
| Zone | Zone géographique (A, B, C, Industrielle) |
| Valeur d'expertise | Valeur issue du dernier rapport d'expertise (FCFA) |
| VNC | Valeur Nette Comptable calculée automatiquement (FCFA) |
| LTV | Ratio Loan-to-Value en pourcentage |
| Statut | Actif / Shortfall / Expiré |
| Dernière réévaluation | Date de la dernière réévaluation effectuée |

**Fonctions de recherche et filtrage :**
- Barre de recherche par référence, nom du client ou adresse du bien
- Filtres par zone géographique, statut, rang d'hypothèque
- Tri par colonne (cliquer sur l'en-tête de colonne)
- Pagination configurable (10, 25, 50 entrées par page)

### 4.2 Création d'une nouvelle hypothèque

**Procédure :**

1. Cliquer sur le bouton **+ Nouvelle hypothèque** (bouton bleu, coin supérieur droit)
2. Renseigner les informations de base :
   - **Référence dossier** : numéro de dossier de crédit associé (obligatoire)
   - **Client / Débiteur** : nom complet du bénéficiaire du crédit (obligatoire)
   - **Numéro de crédit** : identifiant du prêt dans le système central (obligatoire)
3. Renseigner les caractéristiques du bien immobilier :
   - **Adresse complète** du bien hypothéqué
   - **Zone géographique** : sélectionner A, B, C ou Industrielle dans la liste déroulante
   - **Type d'occupation** : Libre / Propriétaire occupant / Loué avec bail enregistré
   - **Rang de l'hypothèque** : 1er, 2ème ou 3ème rang
4. Renseigner les données d'expertise :
   - **Valeur d'expertise** : montant issu du rapport d'expertise (en FCFA)
   - **Date d'expertise** : date de réalisation de l'expertise (format JJ/MM/AAAA)
   - **Expert** : nom ou raison sociale de l'expert immobilier agréé
5. Renseigner les données financières :
   - **Solde du prêt** : encours restant dû (en FCFA)
   - **Date d'inscription** : date d'inscription au registre foncier
6. Cliquer sur **Enregistrer** pour valider la création

> **Note :** La VNC et le LTV sont calculés automatiquement par le système dès l'enregistrement. Il n'est pas nécessaire de les saisir manuellement.

> **Avertissement :** Une expertise datant de plus de 5 ans entraîne automatiquement une décote d'ancienneté de 100 %, rendant la VNC nulle. Veiller à mettre à jour les expertises dans les délais réglementaires.

### 4.3 Modification d'une hypothèque

1. Depuis la liste, cliquer sur l'icône **Modifier** (crayon) sur la ligne de la garantie concernée
2. Modifier les champs souhaités dans le formulaire
3. Cliquer sur **Enregistrer les modifications**

Toute modification déclenche un recalcul immédiat de la VNC et du LTV.

### 4.4 Suppression d'une hypothèque

1. Depuis la liste, cliquer sur l'icône **Supprimer** (corbeille) sur la ligne concernée
2. Une fenêtre de confirmation s'affiche avec le rappel de la référence et du client
3. Cliquer sur **Confirmer la suppression**

> **Avertissement :** La suppression est irréverICOle. Elle ne doit être effectuée que pour des garanties créées par erreur. Les garanties ayant fait l'objet de réévaluations ne peuvent pas être supprimées pour préserver la traçabilité réglementaire.

---

## 5. Procédure de réévaluation bisannuelle

La **réévaluation bisannuelle** est une obligation réglementaire imposée par la Circulaire BCEAO n°04-2017. Elle consiste à actualiser la valeur d'expertise d'une garantie hypothécaire au minimum tous les deux ans.

### 5.1 Déclenchement d'une réévaluation

**Procédure :**

1. Depuis la liste des hypothèques, cliquer sur la référence de la garantie à réévaluer pour accéder à sa fiche détaillée
2. Dans la fiche détaillée, cliquer sur le bouton **Réévaluer** (bouton vert)
3. La fenêtre de réévaluation s'ouvre avec les informations actuelles pré-remplies
4. Saisir la **nouvelle valeur d'expertise** (en FCFA) issue du rapport d'expertise actualisé
5. Saisir la **date de la nouvelle expertise** (format JJ/MM/AAAA)
6. Saisir le **nom de l'expert** ayant réalisé la nouvelle évaluation
7. Renseigner le **motif de la réévaluation** dans le champ texte libre (obligatoire) :
   - Exemple : « Réévaluation bisannuelle réglementaire — rapport d'expertise n°EXP-2026-045 »
   - Exemple : « Mise à jour suite à travaux de rénovation — rapport expert agréé MHUD »
8. Vérifier le récapitulatif des nouvelles valeurs calculées (VNC prévisionnelle, LTV prévisionnel)
9. Cliquer sur **Valider la réévaluation** pour enregistrer

> **Note :** Le motif est obligatoire et constitue un élément de traçabilité essentiel pour l'audit réglementaire. Il doit être suffisamment précis pour permettre de retrouver le rapport d'expertise correspondant.

### 5.2 Impact de la réévaluation

Après validation, le système met à jour automatiquement :
- La valeur d'expertise affichée sur la fiche
- La VNC recalculée avec les décotes applicables
- Le LTV recalculé sur la base du solde du prêt actualisé
- Le statut de la garantie (suppression de l'alerte EXPERTISE_EXPIREE si applicable)
- L'historique des réévaluations avec horodatage et identité de l'opérateur

---

## 6. Revalorisation par indice (2ème/3ème rang)

La **revalorisation par indice** est une méthode simplifiée d'actualisation de la valeur applicable aux hypothèques de **2ème et 3ème rang** lorsqu'une nouvelle expertise complète n'est pas disponible. Elle consiste à appliquer un coefficient d'évolution du marché immobilier local.

### 6.1 Déclenchement d'une revalorisation

**Procédure :**

1. Accéder à la fiche détaillée de la garantie concernée (rang 2 ou rang 3 uniquement)
2. Cliquer sur le bouton **Revaloriser** (bouton orange)
3. La fenêtre de revalorisation s'ouvre
4. Sélectionner la **zone géographique** de référence (pré-remplie depuis la fiche)
5. Saisir le **coefficient d'indice** à appliquer (exprimé en pourcentage, positif ou négatif) :
   - Exemple : +3,5 pour une revalorisation de 3,5 %
   - Exemple : -2,0 pour une dépréciation de 2,0 %
6. Renseigner la **source de l'indice** utilisé (publication officielle, étude de marché, etc.)
7. Vérifier la nouvelle valeur calculée affichée en aperçu
8. Cliquer sur **Confirmer la revalorisation**

> **Note :** La revalorisation par indice est réservée aux hypothèques de 2ème et 3ème rang. Pour les hypothèques de 1er rang, une expertise formelle est obligatoire. Le bouton **Revaloriser** n'apparaît pas pour les garanties de premier rang.

---

## 7. Historique des réévaluations

### 7.1 Accès à l'historique

Depuis la fiche détaillée d'une hypothèque, cliquer sur l'onglet **Historique** pour afficher le journal complet des réévaluations.

### 7.2 Informations affichées

L'historique présente une chronologie complète sous forme de tableau :

| Colonne | Description |
|---|---|
| Date | Date et heure exacte de l'opération (horodatage serveur) |
| Type | Nature de l'opération (Réévaluation / Revalorisation / Création / Modification) |
| Valeur avant | Valeur d'expertise avant l'opération |
| Valeur après | Valeur d'expertise après l'opération |
| VNC calculée | VNC résultante après application des décotes |
| LTV calculé | LTV résultant |
| Motif | Motif saisi par l'opérateur |
| Opérateur | Identifiant de l'utilisateur ayant réalisé l'opération |

### 7.3 Export de l'historique

Le bouton **Exporter l'historique** (disponible sur cette page) permet de télécharger le journal au format CSV pour archivage ou transmission à l'audit.

> **Note :** L'historique est en lecture seule. Aucune entrée ne peut être modifiée ou supprimée, conformément aux exigences de traçabilité réglementaire.

---

## 8. Module Alertes

### 8.1 Accès au module

Cliquer sur **Alertes** dans le menu principal, ou sur le compteur d'alertes affiché dans la barre de navigation supérieure (badge rouge indiquant le nombre d'alertes actives).

### 8.2 Types d'alertes

Le système génère cinq catégories d'alertes automatiques :

| Type d'alerte | Déclencheur | Criticité |
|---|---|---|
| **SHORTFALL** | LTV > 100 % (solde prêt supérieur à la VNC) | Critique |
| **EXPERTISE_EXPIREE** | Date d'expertise dépassant 2 ans (réévaluation obligatoire en retard) | Haute |
| **EXPERTISE_BIENTOT_EXPIREE** | Date d'expertise atteignant 18 mois (préavis 6 mois avant obligation) | Moyenne |
| **EXPERTISE_RENOUVELLEMENT** | Expertise approchant la limite des 2 ans (préavis 1 mois) | Haute |
| **INSCRIPTION_PERIMEE** | Date d'inscription au registre foncier dépassant la durée de validité légale | Haute |

### 8.3 Gestion des alertes

**Traitement d'une alerte :**

1. Depuis la liste des alertes, cliquer sur une alerte pour afficher son détail
2. Consulter les informations de la garantie concernée et la nature du problème
3. Effectuer l'action corrective requise (réévaluer, renouveler l'expertise, etc.)
4. Revenir à l'alerte et cliquer sur **Marquer comme traitée** avec un commentaire de résolution
5. L'alerte passe en statut **Résolue** et est archivée

**Filtrage et tri des alertes :**
- Filtre par type d'alerte (liste déroulante)
- Filtre par statut (Active / Résolue / Toutes)
- Filtre par niveau de criticité
- Tri par date de génération ou par criticité

> **Avertissement :** Les alertes de type SHORTFALL et EXPERTISE_EXPIREE requièrent une action corrective dans les meilleurs délais. Elles peuvent avoir un impact direct sur le calcul des provisions réglementaires de la banque.

---

## 9. Reporting et exports

### 9.1 Accès aux rapports

Cliquer sur **Reporting** dans le menu principal pour accéder au module de génération de rapports.

### 9.2 Rapport annuel réglementaire

Le rapport annuel consolide l'ensemble des données du portefeuille de garanties pour une période déterminée.

**Procédure de génération :**

1. Sélectionner l'**exercice** (année) dans la liste déroulante
2. Choisir le **périmètre** : toutes les agences ou une agence spécifique (selon les droits)
3. Sélectionner le **format d'export** :
   - **CSV** : format texte délimité, compatible avec tous les tableurs
   - **Excel (.xlsx)** : format natif Microsoft Excel avec mise en forme automatique
4. Cliquer sur **Générer le rapport**
5. Une barre de progression s'affiche pendant la génération (variable selon le volume)
6. Cliquer sur **Télécharger** lorsque le fichier est prêt

### 9.3 Contenu du rapport exporté

Le rapport inclut, pour chaque garantie du portefeuille :

| Champ | Description |
|---|---|
| Référence | Identifiant unique de la garantie |
| Client | Nom du débiteur |
| Zone | Zone géographique du bien |
| Valeur d'expertise | Valeur brute issue de l'expertise |
| Date d'expertise | Date de la dernière expertise valide |
| Décote zone | Pourcentage de décote zone appliqué |
| Décote ancienneté | Pourcentage de décote ancienneté appliqué |
| Décote occupation | Pourcentage de décote occupation appliqué |
| VNC | Valeur Nette Comptable résultante |
| Solde prêt | Encours restant dû |
| LTV | Ratio Loan-to-Value |
| Statut | Normal / Shortfall |
| Nombre de réévaluations | Nombre de réévaluations réalisées sur la période |

### 9.4 Exports ponctuels

Depuis la liste des hypothèques, le bouton **Exporter la liste** permet d'exporter les données filtrées et/ou triées au format CSV ou Excel.

---

## 10. Gestion des utilisateurs

> **Accès restreint :** Cette section est réservée au profil **Administrateur** uniquement.

### 10.1 Accès à la gestion des utilisateurs

Cliquer sur **Administration** dans le menu principal, puis sur **Utilisateurs**.

### 10.2 Liste des utilisateurs

La page affiche l'ensemble des comptes utilisateurs actifs et inactifs avec les informations suivantes :
- Nom complet et adresse e-mail
- Profil / Rôle assigné
- Statut du compte (Actif / Inactif / Bloqué)
- Date de dernière connexion
- Statut MFA (Activé / Désactivé)

### 10.3 Création d'un utilisateur

1. Cliquer sur **+ Nouvel utilisateur**
2. Renseigner les informations personnelles :
   - Nom complet (obligatoire)
   - Adresse e-mail professionnelle (obligatoire, unique)
3. Sélectionner le **rôle** dans la liste déroulante
4. Définir un **mot de passe temporaire** (doit respecter la politique : minimum 8 caractères, une majuscule, un chiffre, un caractère spécial)
5. Cocher **Forcer le changement de mot de passe à la première connexion** (recommandé)
6. Cliquer sur **Créer l'utilisateur**

Un e-mail d'accueil est automatiquement envoyé à l'adresse renseignée avec les instructions de connexion.

### 10.4 Modification d'un utilisateur

1. Cliquer sur l'icône **Modifier** sur la ligne de l'utilisateur
2. Modifier les informations souhaitées (rôle, statut, informations personnelles)
3. Cliquer sur **Enregistrer**

### 10.5 Désactivation / Réactivation d'un compte

Pour désactiver un compte (départ d'un collaborateur, suspension) : cliquer sur **Désactiver** sur la ligne de l'utilisateur. Le compte est immédiatement bloqué sans suppression des données associées.

Pour réactiver un compte suspendu : cliquer sur **Réactiver**.

> **Note :** La suppression définitive d'un compte n'est pas posICOle si l'utilisateur a effectué des opérations dans le système (principe de traçabilité). La désactivation est l'action appropriée.

---

## 11. Configuration MFA

L'authentification multi-facteurs (MFA) ajoute une couche de sécurité supplémentaire en demandant un code temporaire à 6 chiffres en plus du mot de passe lors de chaque connexion.

### 11.1 Activation du MFA

1. Cliquer sur l'avatar ou le nom d'utilisateur en haut à droite de l'écran
2. Sélectionner **Mon profil**
3. Dans la section **Sécurité**, cliquer sur **Activer le MFA**
4. Télécharger une application d'authentification si ce n'est pas déjà fait (Google Authenticator, Authy, Microsoft Authenticator)
5. Scanner le **QR code** affiché à l'écran avec l'application d'authentification
6. Saisir le **code à 6 chiffres** généré par l'application pour confirmer la configuration
7. **Conserver les codes de secours** affichés (10 codes à usage unique) dans un endroit sûr
8. Cliquer sur **Confirmer l'activation**

### 11.2 Désactivation du MFA

1. Accéder à **Mon profil > Sécurité**
2. Cliquer sur **Désactiver le MFA**
3. Saisir le mot de passe actuel pour confirmer
4. Saisir un code MFA valide (dernière vérification avant désactivation)
5. Cliquer sur **Confirmer la désactivation**

> **Note :** Le MFA est fortement recommandé pour tous les utilisateurs, et obligatoire pour les profils Administrateur et Responsable Risques selon la politique de sécurité informatique de la Banque ICO.

### 11.3 Codes de secours

En cas de perte ou de remplacement du téléphone, les codes de secours permettent de se connecter sans accès à l'application d'authentification. Chaque code n'est utilisable qu'une seule fois. Pour en générer de nouveaux : **Mon profil > Sécurité > Régénérer les codes de secours**.

---

## 12. Formules et règles métier

### 12.1 Calcul de la Valeur Nette Comptable (VNC)

La VNC est calculée selon la formule définie par la **Circulaire BCEAO n°04-2017** :

```
VNC = Valeur d'expertise × (1 - Décote totale)
Décote totale = Décote zone + Décote ancienneté + Décote occupation
```

### 12.2 Tableau des décotes réglementaires

**Décote par zone géographique :**

| Zone | Description | Décote |
|---|---|---|
| Zone A | Zones urbaines principales (Abidjan plateau, quartiers prime) | 20 % |
| Zone B | Zones urbaines secondaires | 30 % |
| Zone C | Zones périurbaines et rurales | 45 % |
| Zone Industrielle | Zones à usage industriel ou commercial | 40 % |

**Décote par ancienneté de l'expertise :**

| Ancienneté de l'expertise | Décote |
|---|---|
| Moins de 3 ans | 0 % |
| Entre 3 et 5 ans | 10 % |
| Plus de 5 ans | 100 % (VNC nulle) |

**Décote par type d'occupation :**

| Type d'occupation | Décote |
|---|---|
| Libre (inoccupé ou locataire sans bail) | 0 % |
| Propriétaire occupant | 5 % |
| Loué avec bail enregistré | 15 % |

### 12.3 Calcul du LTV (Loan-to-Value)

```
LTV (%) = (Solde du prêt / VNC) × 100
```

Un LTV supérieur à **100 %** indique un **shortfall** : la valeur de la garantie ne couvre plus intégralement l'encours du prêt. Une action corrective est alors requise (demande de garanties complémentaires ou provisionnement).

### 12.4 Exemple de calcul

**Données :**
- Valeur d'expertise : 50 000 000 FCFA
- Zone : B (décote 30 %)
- Ancienneté : 2 ans (décote 0 %)
- Occupation : Loué avec bail (décote 15 %)
- Solde du prêt : 32 000 000 FCFA

**Calcul :**
- Décote totale = 30 % + 0 % + 15 % = 45 %
- VNC = 50 000 000 × (1 - 0,45) = **27 500 000 FCFA**
- LTV = (32 000 000 / 27 500 000) × 100 = **116,4 %**
- Statut : **SHORTFALL** (LTV > 100 %)

---

## 13. Rôles et permissions

Le SGH implémente un contrôle d'accès basé sur les rôles (RBAC). Chaque utilisateur dispose d'un profil unique définissant ses droits d'accès.

| Fonctionnalité | Gestionnaire | Responsable Risques | Engagements | Audit Interne | Administrateur |
|---|:---:|:---:|:---:|:---:|:---:|
| Consulter les hypothèques | ✓ | ✓ | ✓ | ✓ | ✓ |
| Créer une hypothèque | ✓ | — | — | — | ✓ |
| Modifier une hypothèque | ✓ | — | — | — | ✓ |
| Supprimer une hypothèque | — | — | — | — | ✓ |
| Déclencher une réévaluation | ✓ | ✓ | — | — | ✓ |
| Revalorisation par indice | ✓ | ✓ | — | — | ✓ |
| Consulter les alertes | ✓ | ✓ | ✓ | ✓ | ✓ |
| Traiter les alertes | ✓ | ✓ | — | — | ✓ |
| Accéder aux rapports | ✓ | ✓ | ✓ | ✓ | ✓ |
| Exporter les données | ✓ | ✓ | ✓ | ✓ | ✓ |
| Consulter l'historique | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gérer les utilisateurs | — | — | — | — | ✓ |
| Configurer le système | — | — | — | — | ✓ |

---

## 14. Module Simulation & Prévision

AccesICOle via le menu **Simulation** (URL : `/simulation`), ce module permet aux gestionnaires et responsables risques de tester des scénarios hypothétiques sans modifier les données réelles du portefeuille.

### 14.1 Simulation de réévaluation

Ce simulateur calcule l'impact d'une modification de la valeur d'expertise ou des paramètres d'une hypothèque :

1. Sélectionner l'hypothèque cible dans la liste déroulante
2. Saisir la nouvelle valeur d'expertise hypothétique (en FCFA)
3. Modifier si besoin la zone géographique, le type d'occupation ou la date d'expertise simulée
4. Cliquer sur **Simuler**

Le système affiche immédiatement :
- La VNC simulée et l'écart avec la valeur actuelle
- Le LTV simulé et le statut résultant (Couvert / Shortfall)
- La variation en montant et en pourcentage

### 14.2 Simulation de stress test

Ce scénario applique simultanément une décote supplémentaire à un sous-ensemble du portefeuille pour simuler une chute du marché immobilier :

1. Sélectionner le périmètre (toutes zones, ou zone spécifique)
2. Indiquer le pourcentage de baisse de marché à simuler (ex. : -20 %)
3. Cliquer sur **Lancer le stress test**

Le rapport de stress affiche le nombre de dossiers basculant en shortfall, la VNC totale impactée et la variation de couverture du portefeuille.

> **Note :** Toutes les simulations sont temporaires et non enregistrées. Elles n'affectent pas les données réelles du SGH.

---

## 15. Module Intelligence Artificielle

AccesICOle via le menu **Intelligence Artificielle** (URL : `/ia`), ce module fournit des analyses prédictives et des recommandations basées sur les données historiques du portefeuille.

### 15.1 Score de risque automatique

Pour chaque hypothèque, le module IA calcule un **score de risque** (0 à 100) en tenant compte de :
- L'ancienneté de l'expertise
- L'évolution historique du LTV
- La zone géographique et son évolution de marché
- La classification du crédit associé (SAIN, SURVEILLANCE, DOUTEUX, CONTENTIEUX)

### 15.2 Détection d'anomalies

L'IA identifie automatiquement les dossiers présentant des anomalies :
- Valeurs d'expertise incohérentes avec la zone
- LTV anormalement élevé comparé à des dossiers similaires
- Expertises non renouvelées malgré une alerte BCEAO active

### 15.3 Recommandations

Le module génère des recommandations priorisées pour chaque gestionnaire :
- **Urgence haute** : réévaluations overdue (> 2 ans d'ancienneté)
- **Urgence moyenne** : dossiers proches du seuil de shortfall
- **Surveillance** : dossiers en zone à risque marché

> **Note :** Les recommandations IA sont des outils d'aide à la décision. Elles ne remplacent pas l'analyse humaine et n'engagent pas la responsabilité réglementaire de la banque.

---

## 16. Glossaire

| Terme | Définition |
|---|---|
| **BCEAO** | Banque Centrale des États de l'Afrique de l'Ouest — autorité de régulation bancaire de l'UEMOA |
| **Circulaire 04-2017** | Instruction de la BCEAO définissant les modalités de prise en compte des sûretés réelles dans le calcul des provisions pour risque de crédit |
| **Décote** | Coefficient de réduction appliqué à la valeur d'expertise pour refléter le risque de réalisation de la garantie |
| **Expertise immobilière** | Évaluation formelle d'un bien immobilier réalisée par un expert agréé, servant de base au calcul de la VNC |
| **Garantie hypothécaire** | Sûreté réelle immobilière accordée à une banque en garantie du remboursement d'un crédit |
| **Hypothèque de 1er rang** | Hypothèque prioritaire sur un bien, bénéficiant d'un droit de préférence absolu en cas de réalisation |
| **Hypothèque de 2ème/3ème rang** | Hypothèque secondaire sur un bien déjà grevé d'une hypothèque de rang supérieur |
| **Inscription** | Enregistrement de l'hypothèque au registre foncier, condition de son opposabilité aux tiers |
| **LTV (Loan-to-Value)** | Ratio entre l'encours du prêt et la valeur nette comptable de la garantie, exprimé en pourcentage |
| **MFA** | Authentification Multi-Facteurs — mécanisme de sécurité requérant un second facteur d'identification |
| **Provisionnement** | Constitution de réserves comptables par la banque pour couvrir le risque de perte sur un crédit |
| **Réévaluation bisannuelle** | Obligation réglementaire de mettre à jour la valeur des garanties hypothécaires au moins tous les deux ans |
| **Revalorisation par indice** | Actualisation simplifiée de la valeur d'une garantie (2ème/3ème rang) par application d'un coefficient d'évolution du marché |
| **SGH** | SIGGHY — application web développée pour la Banque ICO |
| **Shortfall** | Situation dans laquelle la valeur de la garantie (VNC) est inférieure à l'encours du prêt (LTV > 100 %) |
| **ICO** | Banque ICO |
| **VNC (Valeur Nette Comptable)** | Valeur retenue de la garantie après application des décotes réglementaires (zone, ancienneté, occupation) |

---

*Document établi par la Direction des Systèmes d'Information — Banque ICO*  
*Conformément à la Circulaire BCEAO n°04-2017*  
*Toute reproduction ou diffusion externe est soumise à autorisation préalable*
