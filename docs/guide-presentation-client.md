# SIGGHY — Guide de Présentation Client
## Application de Gestion des Garanties Hypothécaires
### Banque ICO

**Application :** https://sgh-frontend.vercel.app  
**Référence réglementaire :** Circulaire BCEAO n°04-2017  
**Version :** 2.0 — Août 2026

---

## AVANT-PROPOS

Ce document présente le fonctionnement de SIGGHY à travers le **cycle de vie complet d'un dossier hypothécaire**, depuis l'entrée en relation avec le client jusqu'au remboursement final du prêt. Chaque module est illustré par des actions concrètes, dans l'ordre chronologique où un gestionnaire les utiliserait au quotidien.

---

## ACTE 1 — ENTRÉE EN RELATION : LE CLIENT

### Situation
Un promoteur immobilier, **M. Koné Abdoulaye**, souhaite financer la construction d'un immeuble à usage locatif à Abidjan. Il se présente à la Banque ICO pour obtenir un crédit immobilier de 250 millions de FCFA.

### Ce que fait le gestionnaire dans SIGGHY

**Menu → Clients → Nouveau client**

Le gestionnaire crée la fiche du client en renseignant :
- Nom, prénom, type (Personne physique / Personne morale)
- Contacts (téléphone, email, adresse)
- Numéro de pièce d'identité ou RCCM pour les entreprises
- Code client attribué automatiquement (ex : `CLI-021`)

> **Ce que voit le client :** son dossier est ouvert, traçable, accesICOle par tous les services autorisés (Engagements, Risques, Audit) sans ressaisie.

---

## ACTE 2 — LE FINANCEMENT : LE PRÊT

### Situation
Le comité de crédit approuve le financement. Un prêt de **250 000 000 FCFA** sur **120 mois** à un taux de **8,5 %** est accordé à M. Koné.

### Ce que fait le gestionnaire dans SIGGHY

**Menu → Prêts → Nouveau prêt**

Il saisit :
- Code client : `CLI-021` (lié automatiquement à M. Koné)
- Montant : 250 000 000 FCFA
- Taux d'intérêt annuel : 8,5 %
- Durée : 120 mois
- Type d'amortissement : Constant (mensualité fixe)
- Date de début : 01/09/2026
- Objet : Construction immeuble locatif — Cocody

**SIGGHY génère automatiquement :**
- Le numéro de prêt unique (`PRE-2026-021`)
- Le **tableau d'amortissement complet** sur 120 mois (capital dû, intérêts, mensualité)
- L'échéancier avec dates et montants exacts

> **Ce que voit le client :** la banque maîtrise précisément son calendrier de remboursement. Aucun calcul manuel, aucun risque d'erreur.

---

## ACTE 3 — LA GARANTIE : L'HYPOTHÈQUE

### Situation
Pour sécuriser le prêt, M. Koné apporte en garantie un **terrain nu de 2 000 m²** situé en Zone A (Abidjan urbain), dont il est propriétaire selon le Titre Foncier n° TF/AB/44521. Un expert agréé du MHUD a évalué ce bien à **320 000 000 FCFA**.

### Ce que fait le gestionnaire dans SIGGHY

**Menu → Hypothèques → Nouvelle hypothèque**

Il renseigne :
- Client : M. Koné Abdoulaye
- Prêt associé : `PRE-2026-021`
- Numéro de Titre Foncier : `TF/AB/44521`
- Adresse : Cocody, Abidjan — coordonnées GPS
- Zone géographique : **Zone A** (Abidjan urbain)
- Type d'occupation : Terrain libre
- Rang de l'hypothèque : 1er rang
- Valeur d'expertise : **320 000 000 FCFA**
- Date d'expertise : 15/07/2026
- Expert agréé : Cabinet Expertise Immobilière Kouassi
- Date d'inscription foncière : 01/09/2026

**SIGGHY calcule immédiatement et automatiquement :**

```
Valeur d'expertise      : 320 000 000 FCFA
Décote de zone (A)      :  -20 %  →  -64 000 000 FCFA
Décote d'ancienneté     :    0 %  (expertise < 2 ans)
Décote d'occupation     :    0 %  (terrain libre)
─────────────────────────────────────────────────────
VNC (Valeur Nette Comptable) : 256 000 000 FCFA
Solde du prêt           : 250 000 000 FCFA
LTV (Loan-to-Value)     :  97,7 %  →  ✅ COUVERT
```

> **Message clé pour le client :** la banque respecte automatiquement la **Circulaire BCEAO n°04-2017** sans intervention humaine. Le calcul est traçable, auditable et opposable en cas de contrôle.

---

## ACTE 4 — LES EXPERTS AGRÉÉS

### Situation
Le Cabinet Kouassi doit être enregistré dans le système pour être sélectionnable et pour que le système suive la validité de son agrément.

### Ce que fait le gestionnaire

**Menu → Administration → Experts agréés**

Il enregistre :
- Raison sociale et coordonnées du cabinet
- Numéro d'agrément MHUD
- Date d'expiration de l'agrément

**SIGGHY surveille automatiquement** les agréments qui arrivent à expiration et génère une alerte avant la date limite.

> **Ce que cela apporte :** la banque ne peut jamais utiliser par inadvertance une expertise réalisée par un expert dont l'agrément est périmé — ce qui serait une non-conformité réglementaire grave.

---

## ACTE 5 — LES DOCUMENTS : LA GED

### Situation
Le notaire remet les documents liés à la garantie : le rapport d'expertise, l'acte d'hypothèque notarié et la copie du Titre Foncier.

### Ce que fait le gestionnaire

**Menu → GED (Documents) → Nouveau document**

Il uploade chaque document en précisant :
- Titre et type (Rapport d'expertise / Titre Foncier / Acte d'hypothèque)
- Lien avec l'hypothèque `TF/AB/44521`
- Version (v1, v2… si le document est remis à jour)

**SIGGHY conserve :**
- Le fichier en base de données (stockage pérenne, indépendant du serveur)
- L'historique des versions avec date et auteur de l'upload
- La posICOilité de télécharger à tout moment

> **Ce que cela apporte :** fini les dossiers papier perdus, les scans introuvables. Tout est centralisé, versioning inclus, accesICOle depuis n'importe quel poste autorisé.

---

## ACTE 6 — L'ASSURANCE

### Situation
M. Koné souscrit une assurance décès-invalidité et une assurance incendie sur le bien hypothéqué, comme l'exige la banque.

### Ce que fait le gestionnaire

**Menu → Assurances → Nouvelle assurance**

Il enregistre :
- Compagnie d'assurance et numéro de police
- Type (Décès-invalidité / Incendie / Multirisques)
- Montant assuré et prime annuelle
- Date d'échéance de la prime

**SIGGHY surveille** les échéances de prime et génère une alerte si une assurance arrive à expiration sans renouvellement.

> **Ce que cela apporte :** la banque s'assure que les biens hypothéqués restent toujours couverts, protégeant ainsi sa garantie en cas de sinistre.

---

## ACTE 7 — LE SUIVI AUTOMATIQUE : LES ALERTES

### Situation
Le temps passe. Sans système automatisé, un gestionnaire peut oublier qu'une expertise doit être renouvelée dans 3 mois, ou qu'une inscription hypothécaire est sur le point d'expirer.

### Ce que fait SIGGHY

**Menu → Alertes** — chaque matin au démarrage, puis toutes les 24h, le système analyse l'ensemble du portefeuille et génère automatiquement les alertes suivantes :

| Type d'alerte | Déclencheur | Action requise |
|---|---|---|
| **SHORTFALL** | LTV > 100 % (garantie insuffisante) | Réévaluation ou garantie complémentaire |
| **EXPERTISE_EXPIREE** | Expertise > 5 ans | Renouvellement immédiat obligatoire |
| **EXPERTISE_BIENTOT_EXPIREE** | Expertise entre 2 et 3 ans | Planifier le renouvellement |
| **INSCRIPTION_PERIMEE** | Inscription foncière expirée | Renouvellement au registre foncier |
| **RENOUVELLEMENT** | Alerte préventive 3 mois avant 2 ans | Anticipation proactive |

Chaque alerte est viICOle en temps réel dans le tableau de bord et envoyée en notification in-app aux gestionnaires concernés.

> **Message clé :** avec SIGGHY, **aucune échéance réglementaire ne peut passer inaperçue**. Le système travaille 24h/24 pendant que les gestionnaires s'occupent d'autre chose.

---

## ACTE 8 — LA RÉÉVALUATION BISANNUELLE

### Situation
Deux ans ont passé. La réglementation BCEAO impose de mettre à jour la valeur d'expertise de la garantie de M. Koné. Le marché immobilier ayant évolué, un nouvel expert évalue le terrain à **350 000 000 FCFA**.

### Ce que fait le gestionnaire

**Menu → Hypothèques → Fiche TF/AB/44521 → Réévaluer**

Il saisit :
- Nouvelle valeur d'expertise : 350 000 000 FCFA
- Date de la nouvelle expertise : 20/08/2028
- Nom de l'expert : Cabinet Expertise Diarra
- Motif : *Réévaluation bisannuelle réglementaire — rapport n° EXP-2028-144*

**SIGGHY recalcule instantanément :**
```
Nouvelle VNC  : 350 000 000 × 80 % = 280 000 000 FCFA
Solde restant : 198 000 000 FCFA (après 2 ans de remboursements)
LTV           :  70,7 %  →  ✅ COUVERT (amélioration)
```

L'historique complet est conservé : qui a fait la réévaluation, quand, sur quelle base, avec quel expert.

---

## ACTE 9 — LE WORKFLOW DE VALIDATION

### Situation
La politique interne de la Banque ICO exige qu'une réévaluation soit validée par le Responsable Risques avant d'être prise en compte dans les provisions.

### Ce que fait SIGGHY

**Menu → Workflow**

La réévaluation créée par le gestionnaire passe automatiquement en statut **"En attente de validation"**. Le Responsable Risques reçoit une notification, consulte les éléments, et valide ou rejette avec commentaire.

**Circuit de validation :**
```
Gestionnaire Garanties  →  Soumet la réévaluation
Responsable Risques     →  Valide ou rejette (avec commentaire)
Système                 →  Met à jour VNC / LTV / statut
```

> **Ce que cela apporte :** le quatre-yeux réglementaire est intégré dans l'outil, pas dans des échanges de mails informels.

---

## ACTE 10 — LES PROVISIONS ET LE SCORING

### Situation
Le service Risques doit calculer les provisions réglementaires sur le portefeuille hypothécaire pour la clôture de l'exercice.

### Ce que fait SIGGHY

**Menu → Provisions**

Le système calcule automatiquement, pour chaque prêt, la provision à constituer selon la classification BCEAO :

| Classification | Taux de provision | Description |
|---|---|---|
| **SAIN** | 0 % | Prêt performant, garantie suffisante |
| **SURVEILLANCE** | 5 % | Signaux d'alerte (LTV proche de 100 %) |
| **DOUTEUX** | 35 % | Défauts ponctuels, garantie partiellement insuffisante |
| **CONTENTIEUX** | 100 % | Procédure judiciaire engagée |

**Menu → Scoring**

Pour chaque hypothèque, SIGGHY affiche un **score de risque** (0 à 100) calculé en combinant : LTV, ancienneté de l'expertise, historique des réévaluations et classification du crédit.

---

## ACTE 11 — LA SIMULATION

### Situation
Le Responsable Risques veut savoir ce qui se passerait sur le portefeuille si le marché immobilier chutait de 20 % (stress test réglementaire).

### Ce que fait SIGGHY

**Menu → Simulation → Stress test**

Il saisit : décote de marché supplémentaire = -20 %

En quelques secondes, SIGGHY affiche :
- Nombre de dossiers basculant en shortfall
- VNC totale du portefeuille après choc
- Montant de provisions complémentaires à constituer

Il peut aussi simuler une réévaluation individuelle pour un dossier précis, sans toucher aux données réelles.

> **Ce que cela apporte :** la banque peut tester ses scénarios de stress *avant* de les soumettre à la BCEAO, et anticiper les besoins en fonds propres.

---

## ACTE 12 — L'INTELLIGENCE ARTIFICIELLE

### Situation
Le portefeuille compte maintenant 200 dossiers. Le gestionnaire ne peut pas analyser manuellement chacun pour détecter les risques émergents.

### Ce que fait SIGGHY

**Menu → Intelligence Artificielle**

Le module IA analyse en continu l'ensemble du portefeuille et produit :

1. **Scores de risque automatiques** — chaque hypothèque reçoit un score de 0 à 100 basé sur l'ensemble des indicateurs (LTV, ancienneté, zone, classification)

2. **Détection d'anomalies** — le système identifie les dossiers dont les valeurs sont incohérentes avec leur zone géographique ou leur historique

3. **Recommandations priorisées** :
   - 🔴 Urgence haute : expertises overdue, shortfalls non traités
   - 🟡 Urgence moyenne : dossiers proches du seuil critique
   - 🟢 Surveillance : dossiers en zone à risque marché

Le gestionnaire reçoit chaque matin une liste d'actions prioritaires, **triées par ordre d'urgence réglementaire**.

---

## ACTE 13 — LE REPORTING RÉGLEMENTAIRE

### Situation
La direction de la Banque ICO doit produire son rapport annuel sur les garanties hypothécaires pour la BCEAO.

### Ce que fait SIGGHY

**Menu → Rapports**

En un clic, SIGGHY génère :
- **Rapport annuel standard** : tableau de bord complet avec VNC totale, LTV moyen, nombre de shortfalls, alertes actives
- **Export Excel** : tableau détaillé dossier par dossier, prêt par prêt
- **Export BCEAO** : format réglementaire conforme à la Circulaire 04-2017

**Menu → Reporting BCEAO**

Rapport formaté selon les exigences exactes de la BCEAO : classification du portefeuille, provisions constituées, ratios de couverture.

> **Message clé :** le rapport qui prenait 3 jours à préparer sous Excel est généré en 30 secondes. Toutes les données sont fiables, traçables et auditables.

---

## ACTE 14 — LE RECOUVREMENT

### Situation
Malheureusement, un autre client du portefeuille, Mme Traoré, est en défaut de paiement depuis 6 mois. La banque engage une procédure de recouvrement.

### Ce que fait SIGGHY

**Menu → Recouvrement → Nouveau dossier**

Le gestionnaire enregistre :
- Le dossier de recouvrement lié au prêt de Mme Traoré
- Les étapes de la procédure (mise en demeure, saisie, vente judiciaire)
- Les montants récupérés à chaque étape

Le système maintient le lien avec l'hypothèque concernée et met à jour le statut du prêt en **CONTENTIEUX**.

---

## ACTE 15 — LA MAINLEVÉE : FIN DU CYCLE

### Situation
M. Koné a remboursé intégralement son prêt au bout de 10 ans. Il demande la mainlevée de l'hypothèque pour récupérer son titre foncier libre de toute charge.

### Ce que fait le gestionnaire

**Menu → Mainlevées → Nouvelle mainlevée**

Il crée la demande de mainlevée liée à l'hypothèque `TF/AB/44521` :
- Vérification du solde nul du prêt
- Génération de l'acte de mainlevée
- Enregistrement de la date de radiation au registre foncier

Le dossier passe en statut **MAINLEVÉE ACCORDÉE**. L'hypothèque est clôturée dans le système, conservée à des fins d'audit réglementaire.

---

## ACTE 16 — LA TRAÇABILITÉ : L'AUDIT

### Situation
La BCEAO effectue un contrôle sur place et demande l'historique complet des modifications apportées au dossier de M. Koné sur les 10 dernières années.

### Ce que fait SIGGHY

**Menu → Audit → Journal des opérations**

En quelques secondes, le rapport d'audit affiche :
- Chaque action effectuée (création, modification, réévaluation, archivage)
- L'identité de l'utilisateur qui l'a effectuée
- La date et l'heure exactes
- La valeur avant et après chaque modification

> **Message clé :** SIGGHY est un **système de preuve**. Chaque action est horodatée, nominative et immuable. La banque peut répondre à n'importe quelle question de l'auditeur en moins de 60 secondes.

---

## RÉCAPITULATIF — UN ÉCOSYSTÈME INTÉGRÉ

```
  CLIENT ──────────────┐
                       │
                       ▼
  PRÊT ────────────────┤   Tableau d'amortissement automatique
                       │
                       ▼
  HYPOTHÈQUE ──────────┤   Calcul VNC + LTV (BCEAO 04-2017)
          │            │
          │            ├── EXPERT AGRÉÉ   (suivi des agréments)
          │            ├── GED            (documents centralisés)
          │            ├── ASSURANCE      (couverture du bien)
          │            │
          │            ▼
          │    ALERTES AUTOMATIQUES  (24h/24, 7j/7)
          │            │
          │            ▼
          │    RÉÉVALUATION BISANNUELLE + WORKFLOW
          │            │
          │            ▼
          │    PROVISIONS + SCORING
          │            │
          │    ┌───────┴───────┐
          │    │               │
          │    ▼               ▼
          │  SIMULATION      INTELLIGENCE ARTIFICIELLE
          │    │               │
          │    └───────┬───────┘
          │            │
          │            ▼
          │    REPORTING RÉGLEMENTAIRE (BCEAO)
          │            │
          ├── RECOUVREMENT (si défaut)
          │
          └── MAINLEVÉE (si remboursement total)
                        │
                        ▼
                    AUDIT TRAIL (immuable)
```

---

## AVANTAGES CLÉS POUR LE CLIENT (RÉSUMÉ DÉCIDEUR)

| Avant SIGGHY | Avec SIGGHY |
|---|---|
| Fichiers Excel disparates, risque d'erreur | Base centralisée, calculs automatiques et certifiés |
| Réévaluations oubliées, pénalités BCEAO | Alertes automatiques 24h/24, aucune échéance ratée |
| 3 jours pour préparer le rapport annuel | Rapport généré en 30 secondes |
| Traçabilité partielle, audit difficile | Journal d'audit complet, réponse en < 60 secondes |
| Analyse manuelle du portefeuille | IA + scoring automatique sur l'ensemble du portefeuille |
| Simulation sur Excel, données réelles modifiées | Simulateur dédié, données réelles préservées |
| Documents dispersés (mails, armoires) | GED centralisée, versioning, accès contrôlé |

---

## ACCÈS DE DÉMONSTRATION

| Profil | Email | Mot de passe | Ce qu'il voit |
|---|---|---|---|
| Administrateur | admin@banque.sn | Admin@1234 | Tout le système |
| Gestionnaire Garanties | gestionnaire@banque.sn | Gest@1234 | Gestion opérationnelle complète |
| Responsable Risques | risques@banque.sn | Risques@1234 | Portefeuille, alertes, reporting, IA |
| Engagements | engagements@banque.sn | Engag@1234 | Consultation des dossiers |
| Audit Interne | audit@banque.sn | Audit@1234 | Journal d'audit + conformité |

**URL :** https://sgh-frontend.vercel.app

> Le portefeuille de démonstration contient **25 hypothèques** réparties sur 4 zones géographiques (Zone A, B, C, Industrielle), avec des cas réels : shortfalls, expertises expirées, inscriptions périmées, alertes actives — pour illustrer tous les modules en situation réelle.

---

*Banque ICO — SIGGHY v2.0*  
*Document de présentation commerciale — Août 2026*  
*Confidentiel — Usage interne et présentation client uniquement*
