-- =====================================================================
-- Base de Données PostgreSQL : Gestion des charges d'enseignement (UVCI)
-- =====================================================================
-- Description : Ce script DDL génère la structure de la base de données
-- à partir du Modèle Logique de Données (MLD) demandé.
-- 
-- SGBD Cible : PostgreSQL
-- Date de génération : 2026-04-12
-- =====================================================================

-- =====================================================================
-- 1. BLOC : UTILISATEURS (Administrateur, Secretaire_principal, Enseignants)
-- =====================================================================

CREATE TABLE GRADE (
    id_grade SERIAL PRIMARY KEY,
    lib_grade VARCHAR(100) NOT NULL
);

CREATE TABLE STATUT (
    id_statut SERIAL PRIMARY KEY,
    lib_statut VARCHAR(100) NOT NULL
);

CREATE TABLE DEPARTEMENT (
    id_depart SERIAL PRIMARY KEY,
    lib_depart VARCHAR(150) NOT NULL
);

-- Administrateur (Entité forte)
CREATE TABLE ADMINISTRATEUR (
    user_log_adm  VARCHAR(50)  PRIMARY KEY,
    user_pasw_adm VARCHAR(255) NOT NULL,
    ann_aca       INTEGER      NOT NULL,
    rol_usr       VARCHAR(50)  NOT NULL,
    para_cal      NUMERIC      NOT NULL,
    coef_niv      NUMERIC      NOT NULL,
    taux_hor      NUMERIC      NOT NULL
);

-- Secrétaire Principal (Dépend de Administrateur)
CREATE TABLE SECRETAIRE_PRINCIPAL (
    user_log_sp VARCHAR(50) PRIMARY KEY,
    user_log_adm VARCHAR(50) NOT NULL,
    user_pasw_sp VARCHAR(255) NOT NULL,
    nom_sp VARCHAR(100) NOT NULL,
    pren_sp VARCHAR(100) NOT NULL,
    email_sp VARCHAR(150) NOT NULL,
    rol_sp VARCHAR(50) NOT NULL,
    CONSTRAINT fk_sp_admin FOREIGN KEY (user_log_adm) 
        REFERENCES ADMINISTRATEUR(user_log_adm) ON DELETE CASCADE
);

-- Enseignants (Dépend de Administrateur, Secrétaire, Grade, Statut, Département)
CREATE TABLE ENSEIGNANTS (
    id_ens SERIAL PRIMARY KEY,
    user_log_adm VARCHAR(50) NOT NULL,   -- FK → ADMINISTRATEUR (association « créer »)
    user_log_sp VARCHAR(50) NOT NULL,
    id_grade INTEGER NOT NULL,
    id_statut INTEGER NOT NULL,
    id_depart INTEGER NOT NULL,
    user_log_ens VARCHAR(50) UNIQUE NOT NULL,
    user_pasw_ens VARCHAR(255) NOT NULL,
    nom_ens VARCHAR(100) NOT NULL,
    pren_ens VARCHAR(100) NOT NULL,
    email_ens VARCHAR(150) NOT NULL,
    tel_ens VARCHAR(20) NOT NULL,       -- [FIX #5] Casse corrigée : Tel_ens -> tel_ens
    taux_hor_ens NUMERIC NOT NULL,
    CONSTRAINT fk_ens_admin FOREIGN KEY (user_log_adm)
        REFERENCES ADMINISTRATEUR(user_log_adm) ON DELETE RESTRICT,
    CONSTRAINT fk_ens_sec FOREIGN KEY (user_log_sp) 
        REFERENCES SECRETAIRE_PRINCIPAL(user_log_sp) ON DELETE CASCADE,
    CONSTRAINT fk_ens_grade FOREIGN KEY (id_grade) 
        REFERENCES GRADE(id_grade) ON DELETE RESTRICT,
    CONSTRAINT fk_ens_statut FOREIGN KEY (id_statut) 
        REFERENCES STATUT(id_statut) ON DELETE RESTRICT,
    CONSTRAINT fk_ens_depart FOREIGN KEY (id_depart) 
        REFERENCES DEPARTEMENT(id_depart) ON DELETE RESTRICT
);

-- =====================================================================
-- 2. BLOC : RÉFÉRENTIEL (Niveau d'étude, Cours, Séquence, Ressources)
-- =====================================================================

CREATE TABLE NIVEAU_ETUDE (
    id_niveau SERIAL PRIMARY KEY,
    lib_niveau VARCHAR(100) NOT NULL
);

-- [FIX #1] Ajout de id_niveau (FK) pour lier COURS à NIVEAU_ETUDE
CREATE TABLE COURS (
    id_cours SERIAL PRIMARY KEY,
    id_niveau INTEGER NOT NULL,
    int_cours VARCHAR(150) NOT NULL,
    filiere VARCHAR(100) NOT NULL,
    semestre VARCHAR(50) NOT NULL,
    nb_heures INTEGER NOT NULL CHECK (nb_heures > 0),
    nb_credits INTEGER NOT NULL,
    CONSTRAINT fk_cours_niveau FOREIGN KEY (id_niveau)
        REFERENCES NIVEAU_ETUDE(id_niveau) ON DELETE RESTRICT
);

-- [FIX #4] Renommage de SEQUENCE en SEQUENCE_COURS pour éviter
-- le conflit avec le mot réservé PostgreSQL "SEQUENCE"
CREATE TABLE SEQUENCE_COURS (
    id_seq SERIAL PRIMARY KEY,
    id_cours INTEGER NOT NULL,
    titre_seq VARCHAR(150) NOT NULL,
    -- Contrainte (RG1) de structure : 
    -- RAPPEL : 1 heure de cours = 4 séquences
    CONSTRAINT fk_seq_cours FOREIGN KEY (id_cours) 
        REFERENCES COURS(id_cours) ON DELETE CASCADE
);

CREATE TABLE TYPE_RESSOURCE (
    id_typ_res SERIAL PRIMARY KEY,
    typ_res VARCHAR(100) NOT NULL
);

-- Ressources : Dépendent de Séquence et Type_Ressource
CREATE TABLE RESSOURCE (
    id_res SERIAL PRIMARY KEY,
    id_seq INTEGER NOT NULL,
    id_typ_res INTEGER NOT NULL,
    id_cours INTEGER NOT NULL,          -- [FIX MCD] FK ajoutée : association "être associé" (Cours → Ressource)
    titre_res VARCHAR(150) NOT NULL,
    CONSTRAINT fk_res_seq FOREIGN KEY (id_seq) 
        REFERENCES SEQUENCE_COURS(id_seq) ON DELETE CASCADE,
    CONSTRAINT fk_res_type FOREIGN KEY (id_typ_res) 
        REFERENCES TYPE_RESSOURCE(id_typ_res) ON DELETE RESTRICT,
    CONSTRAINT fk_res_cours FOREIGN KEY (id_cours)
        REFERENCES COURS(id_cours) ON DELETE RESTRICT
);

-- =====================================================================
-- 3. BLOC : MOTEUR DE CALCUL (Complexité, Type d'activité, Paramètres)
-- =====================================================================

-- [FIX MCD] user_log_adm (FK) dans NIVEAU_COMPLEXITE :
-- Cardinalité 1,n côté ADMINISTRATEUR → 1,1 côté NIVEAU_COMPLEXITE
-- Un administrateur peut définir plusieurs niveaux ; chaque niveau est défini par un seul administrateur.
CREATE TABLE NIVEAU_COMPLEXITE (
    id_niv_complex SERIAL        PRIMARY KEY,
    user_log_adm   VARCHAR(50)   NOT NULL,   -- FK → ADMINISTRATEUR (association "déterminer")
    lib_niveau     VARCHAR(100)  NOT NULL,
    description    TEXT          NOT NULL,
    coef_hor       NUMERIC       NOT NULL,
    CONSTRAINT fk_nc_admin FOREIGN KEY (user_log_adm)
        REFERENCES ADMINISTRATEUR(user_log_adm) ON DELETE RESTRICT
);

CREATE TABLE TYPE_ACTIVITE (
    id_typ_activite SERIAL PRIMARY KEY,
    lib_activite VARCHAR(100) NOT NULL,
    multiplicateur_base NUMERIC DEFAULT 1.0 NOT NULL
);

-- [FIX MCD] Ajout de user_log_adm (FK) — association "définir/valider" du MCD
CREATE TABLE PARAMETRE (
    id_param SERIAL PRIMARY KEY,
    user_log_adm VARCHAR(50) NOT NULL,
    annee_acad INTEGER NOT NULL,
    taux_hor_defaut NUMERIC NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    CONSTRAINT fk_param_admin FOREIGN KEY (user_log_adm)
        REFERENCES ADMINISTRATEUR(user_log_adm) ON DELETE RESTRICT,
    CONSTRAINT chk_dates CHECK (date_fin >= date_debut)
);

-- =====================================================================
-- 4. BLOC : SUIVI - Table de jointure centrale (Activité Pédagogique)
-- =====================================================================

CREATE TABLE ACTIVITE_PEDAGOGIQUE (
    id_activite SERIAL PRIMARY KEY,
    id_ens INTEGER NOT NULL,
    user_log_sp VARCHAR(50) NOT NULL,
    id_res INTEGER NOT NULL,
    id_cours INTEGER NOT NULL,              -- [FIX MCD] Association "gérer" (Activité → Cours)
    id_param INTEGER NOT NULL,
    id_niv_complex INTEGER NOT NULL,
    id_typ_activite INTEGER NOT NULL,
    date_saisie DATE DEFAULT CURRENT_DATE NOT NULL,
    
    -- Règles de calcul (RG2 & Pondération) :
    -- Calculé via le Trigger trg_calc_vol_hor (voir ci-dessous) :
    -- 1. vol_hor_cal = (Nombre de séquences du cours lié) × (coef_hor du niveau de complexité)
    -- 2. Si lib_activite = 'Mise à jour', appliquer multiplicateur_base = 0.5
    vol_hor_cal NUMERIC DEFAULT 0,
    
    CONSTRAINT fk_act_ens FOREIGN KEY (id_ens) 
        REFERENCES ENSEIGNANTS(id_ens) ON DELETE RESTRICT,
    CONSTRAINT fk_act_sec FOREIGN KEY (user_log_sp) 
        REFERENCES SECRETAIRE_PRINCIPAL(user_log_sp) ON DELETE RESTRICT,
    CONSTRAINT fk_act_res FOREIGN KEY (id_res) 
        REFERENCES RESSOURCE(id_res) ON DELETE RESTRICT,
    CONSTRAINT fk_act_cours FOREIGN KEY (id_cours)
        REFERENCES COURS(id_cours) ON DELETE RESTRICT,
    CONSTRAINT fk_act_param FOREIGN KEY (id_param) 
        REFERENCES PARAMETRE(id_param) ON DELETE RESTRICT,
    CONSTRAINT fk_act_niv FOREIGN KEY (id_niv_complex) 
        REFERENCES NIVEAU_COMPLEXITE(id_niv_complex) ON DELETE RESTRICT,
    CONSTRAINT fk_act_typ FOREIGN KEY (id_typ_activite) 
        REFERENCES TYPE_ACTIVITE(id_typ_activite) ON DELETE RESTRICT
);

-- =====================================================================
-- 5. BLOC : INDEX SUR CLÉS ÉTRANGÈRES  [FIX #8]
-- =====================================================================
-- PostgreSQL ne crée PAS d'index automatiquement sur les colonnes FK.
-- Ces index améliorent les performances des JOIN et des ON DELETE CASCADE.

CREATE INDEX idx_sp_admin ON SECRETAIRE_PRINCIPAL(user_log_adm);

CREATE INDEX idx_ens_admin ON ENSEIGNANTS(user_log_adm);
CREATE INDEX idx_ens_sp ON ENSEIGNANTS(user_log_sp);
CREATE INDEX idx_ens_grade ON ENSEIGNANTS(id_grade);
CREATE INDEX idx_ens_statut ON ENSEIGNANTS(id_statut);
CREATE INDEX idx_ens_depart ON ENSEIGNANTS(id_depart);

CREATE INDEX idx_cours_niveau ON COURS(id_niveau);

CREATE INDEX idx_seq_cours ON SEQUENCE_COURS(id_cours);

CREATE INDEX idx_res_seq ON RESSOURCE(id_seq);
CREATE INDEX idx_res_type ON RESSOURCE(id_typ_res);

CREATE INDEX idx_act_ens ON ACTIVITE_PEDAGOGIQUE(id_ens);
CREATE INDEX idx_act_sp ON ACTIVITE_PEDAGOGIQUE(user_log_sp);
CREATE INDEX idx_act_res ON ACTIVITE_PEDAGOGIQUE(id_res);
CREATE INDEX idx_act_param ON ACTIVITE_PEDAGOGIQUE(id_param);
CREATE INDEX idx_act_cours ON ACTIVITE_PEDAGOGIQUE(id_cours);
CREATE INDEX idx_act_niv ON ACTIVITE_PEDAGOGIQUE(id_niv_complex);
CREATE INDEX idx_act_typ ON ACTIVITE_PEDAGOGIQUE(id_typ_activite);

CREATE INDEX idx_param_admin ON PARAMETRE(user_log_adm);

CREATE INDEX idx_nc_admin ON NIVEAU_COMPLEXITE(user_log_adm);
CREATE INDEX idx_res_cours ON RESSOURCE(id_cours);

-- =====================================================================
-- 6. BLOC : TRIGGER DE CALCUL AUTOMATIQUE (RG2)  [FIX #3 complément]
-- =====================================================================
-- Ce trigger calcule automatiquement vol_hor_cal AVANT chaque insertion
-- Formule : vol_hor_cal = nb_sequences_du_cours × coef_hor × multiplicateur
-- Si le type d'activité est 'Mise à jour', le multiplicateur est 0.5

CREATE OR REPLACE FUNCTION fn_calc_vol_hor()
RETURNS TRIGGER AS $$
DECLARE
    v_nb_sequences INTEGER;
    v_coef_hor NUMERIC;
    v_multiplicateur NUMERIC;
    v_id_cours INTEGER;
BEGIN
    -- 1. Utiliser directement id_cours depuis la ligne insérée (FK directe MCD)
    v_id_cours := NEW.id_cours;

    -- 2. Compter le nombre de séquences de ce cours
    SELECT COUNT(*) INTO v_nb_sequences
    FROM SEQUENCE_COURS
    WHERE id_cours = v_id_cours;

    -- 3. Récupérer le coefficient horaire du niveau de complexité
    SELECT coef_hor INTO v_coef_hor
    FROM NIVEAU_COMPLEXITE
    WHERE id_niv_complex = NEW.id_niv_complex;

    -- 4. Récupérer le multiplicateur du type d'activité
    -- RG2 : Si 'Mise à jour', multiplicateur_base = 0.5
    SELECT multiplicateur_base INTO v_multiplicateur
    FROM TYPE_ACTIVITE
    WHERE id_typ_activite = NEW.id_typ_activite;

    -- 5. Calculer vol_hor_cal
    NEW.vol_hor_cal := v_nb_sequences * COALESCE(v_coef_hor, 1) * COALESCE(v_multiplicateur, 1);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_vol_hor
    BEFORE INSERT OR UPDATE ON ACTIVITE_PEDAGOGIQUE
    FOR EACH ROW
    EXECUTE FUNCTION fn_calc_vol_hor();

-- =====================================================================
-- 7. BLOC : TRIGGER DE VALIDATION RG1 (4 séquences max par heure)
-- =====================================================================
-- [FIX #7] Ce trigger empêche d'insérer plus de (nb_heures × 4) séquences
-- pour un même cours, conformément à la règle RG1.

CREATE OR REPLACE FUNCTION fn_check_nb_sequences()
RETURNS TRIGGER AS $$
DECLARE
    v_nb_heures INTEGER;
    v_nb_sequences_actuelles INTEGER;
    v_max_sequences INTEGER;
BEGIN
    -- Récupérer le nombre d'heures du cours parent
    SELECT nb_heures INTO v_nb_heures
    FROM COURS
    WHERE id_cours = NEW.id_cours;

    v_max_sequences := v_nb_heures * 4;

    -- Compter les séquences existantes pour ce cours
    SELECT COUNT(*) INTO v_nb_sequences_actuelles
    FROM SEQUENCE_COURS
    WHERE id_cours = NEW.id_cours;

    -- Vérification (on compare AVANT insertion, donc >= et non >)
    IF v_nb_sequences_actuelles >= v_max_sequences THEN
        RAISE EXCEPTION 'RG1 violée : Le cours (id=%) a déjà % séquence(s) sur un maximum de % (% heures × 4).',
            NEW.id_cours, v_nb_sequences_actuelles, v_max_sequences, v_nb_heures;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_nb_sequences
    BEFORE INSERT OR UPDATE ON SEQUENCE_COURS
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_nb_sequences();

-- =====================================================================
-- 8. BLOC : COMMENTAIRES ET DOCUMENTATION DES MÉTADONNÉES
-- =====================================================================

COMMENT ON TABLE SEQUENCE_COURS IS 
'Structure (RG1) : Contrainte métier stricte — 1 heure de cours = 4 séquences. Contrôlé par le trigger trg_check_nb_sequences.';

COMMENT ON COLUMN ACTIVITE_PEDAGOGIQUE.vol_hor_cal IS 
'Calcul automatique (RG2) : Calculé par le trigger trg_calc_vol_hor.
Formule : vol_hor_cal = Nombre de séquences × coef_hor × multiplicateur_base.
Pondération : Les activités de type "Mise à jour" appliquent un multiplicateur de 0,5.';

-- =====================================================================
-- FIN DU SCRIPT DDL
-- =====================================================================
