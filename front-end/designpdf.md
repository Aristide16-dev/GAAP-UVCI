# DOCUMENT DESIGN SYSTEM

## Système de Design des Documents Administratifs

### Plateforme de Gestion Administrative des Enseignants

Version : 1.0

---

# VISION

Tous les documents générés par l'application doivent sembler provenir du même produit logiciel.

Un utilisateur doit immédiatement reconnaître qu'un PDF, un fichier Excel ou un document imprimé appartient à la plateforme.

Les exports doivent conserver :

* la même identité visuelle ;
* les mêmes couleurs ;
* les mêmes principes UX ;
* la même hiérarchie visuelle ;
* la même qualité de présentation.

Les documents doivent être adaptés à :

* l'administration universitaire ;
* la direction ;
* les enseignants ;
* les inspections ;
* les partenaires institutionnels.

---

# ADN VISUEL

L'application repose sur une identité :

* Moderne
* Académique
* Institutionnelle
* Élégante
* Professionnelle

L'ambiance visuelle est basée sur :

Violet Institutionnel + Blanc Cassé + Vert de Validation.

Le violet représente :

* l'éducation ;
* la connaissance ;
* l'innovation ;
* l'autorité académique.

---

# PALETTE OFFICIELLE

## Couleur Principale

Nom : Academic Purple

Hex :

#A020A0

Usage :

* titres principaux ;
* entêtes ;
* éléments importants ;
* KPI principaux ;
* numéros de référence.

---

## Couleur Secondaire

Violet Clair

Usage :

* sous-sections ;
* bandeaux ;
* encadrés ;
* graphiques secondaires.

---

## Couleur Validation

Vert Institutionnel

Usage :

* validé ;
* approuvé ;
* accepté ;
* conforme.

---

## Couleur Information

Bleu Violet

Usage :

* informations ;
* statistiques ;
* notifications.

---

## Couleur Attention

Ambre

Usage :

* en attente ;
* révision ;
* vérification.

---

## Couleur Erreur

Rouge Rosé

Usage :

* rejet ;
* anomalie ;
* suppression.

---

# TYPOGRAPHIE

Police officielle :

Inter

Fallback :

Poppins

Fallback :

Roboto

---

# HIÉRARCHIE TYPOGRAPHIQUE

Titre Document

32px
Bold

Couleur :

Primary

---

Titre Section

20px
SemiBold

---

Sous-section

16px
Medium

---

Texte Standard

12px

---

Texte Technique

11px

---

Notes

10px

---

# STRUCTURE UNIVERSELLE PDF

Tous les PDF doivent suivre cette structure :

HEADER

INFORMATIONS GÉNÉRALES

KPI

CONTENU PRINCIPAL

RÉCAPITULATIF

SIGNATURES

FOOTER

---

# HEADER

Le header doit immédiatement identifier :

* l'établissement ;
* le document ;
* l'année académique ;
* la date ;
* le système.

Composition :

Logo
Nom établissement
Nom système
Titre document

à droite :

Date génération
Référence
Version

Une ligne violette doit séparer le header du contenu.

---

# CARTES KPI

Les indicateurs doivent être affichés sous forme de cartes.

Jamais sous forme de texte brut.

Chaque carte contient :

Icône

Valeur

Libellé

Variation éventuelle

Exemples :

Nombre d'enseignants

Volume horaire

Cours attribués

Productions validées

Demandes en attente

---

# TABLEAUX

Les tableaux sont le cœur du document.

Règles :

Header violet.

Texte blanc.

Hauteur minimale :

40px

Padding horizontal :

12px

Padding vertical :

10px

Alternance des lignes.

Lignes très légèrement colorées.

Jamais de tableau compact.

Le tableau doit respirer.

---

# DENSITÉ D'INFORMATION

Principe fondamental :

Une donnée importante doit être visible en moins de 3 secondes.

Interdire :

Colonnes trop serrées

Texte collé

Paragraphes massifs

Surcharge visuelle

---

# ORGANISATION DES DONNÉES

Toujours regrouper les informations.

Exemple :

INFORMATIONS PERSONNELLES

Nom

Prénom

Matricule

Grade

Département

---

INFORMATIONS PÉDAGOGIQUES

Cours

Volume Horaire

Responsabilités

---

INFORMATIONS ADMINISTRATIVES

Statut

Validation

Observations

---

# BADGES

VALIDÉ

Fond vert clair

Texte vert foncé

Icône validation

---

EN ATTENTE

Fond ambre

Texte ambre foncé

---

REFUSÉ

Fond rouge clair

Texte rouge foncé

---

BROUILLON

Fond gris

Texte gris foncé

---

# SECTIONS IMPORTANTES

Les informations critiques doivent être placées dans des encadrés.

Exemple :

Volume horaire total

Montant total

Décision finale

Observation administrative

---

# SIGNATURES

Disposition :

Secrétaire

Responsable Pédagogique

Direction

Cachet

Les zones doivent être parfaitement alignées.

Prévoir un espace suffisant pour la signature manuscrite.

---

# FOOTER

Toujours afficher :

Nom du système

Page X/Y

Date de génération

Version

Mention :

Document généré automatiquement par le système de gestion administrative.

---

# EXCEL DESIGN SYSTEM

Les exports Excel doivent respecter les mêmes couleurs.

---

Feuille 1

Résumé Exécutif

---

Feuille 2

Données détaillées

---

Feuille 3

Statistiques

---

Feuille 4

Référentiels

---

# STYLES EXCEL

Titre principal :

Fond Primary

Texte blanc

Gras

Fusionné

---

En-têtes :

Fond Violet Clair

Texte blanc

Gras

---

Filtres :

Toujours activés

---

Colonnes :

Largeur automatique

---

Première ligne :

Gelée

---

# RÈGLES IA

Toute IA générant un document doit :

1. Respecter cette charte.
2. Réutiliser les couleurs officielles.
3. Respecter la hiérarchie visuelle.
4. Optimiser la lisibilité.
5. Optimiser l'impression.
6. Préserver la cohérence avec l'application React.
7. Faire apparaître clairement les informations importantes.
8. Produire un résultat comparable aux logiciels universitaires modernes.

Si un choix de design est ambigu :

Priorité :

Lisibilité > Clarté > Cohérence > Esthétique.
