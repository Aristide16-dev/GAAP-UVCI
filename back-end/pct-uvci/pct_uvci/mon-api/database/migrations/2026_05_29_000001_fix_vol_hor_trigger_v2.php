<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // Drop the old trigger first, then recreate function + trigger
        DB::unprepared('DROP TRIGGER IF EXISTS trg_calc_vol_hor ON activite_pedagogique;');

        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION fn_calc_vol_hor()
RETURNS TRIGGER AS $$
DECLARE
    v_nb_sequences   INTEGER;
    v_coef_hor       NUMERIC;
    v_multiplicateur NUMERIC;
BEGIN
    -- Nombre de séquences = nb_heures × 4 (règle UVCI)
    SELECT nb_heures * 4 INTO v_nb_sequences
    FROM cours
    WHERE id_cours = NEW.id_cours;

    -- Coefficient du niveau de complexité
    SELECT coeff_niv_complex INTO v_coef_hor
    FROM niveaux_complexite
    WHERE id_niv_complex = NEW.id_niv_complex;

    -- Multiplicateur du type d'activité
    SELECT multiplicateur_base INTO v_multiplicateur
    FROM type_activite
    WHERE id_typ_activite = NEW.id_typ_activite;

    -- Fallback si valeurs manquantes ou nulles
    IF v_nb_sequences IS NULL OR v_nb_sequences <= 0 THEN
        v_nb_sequences := 0;
    END IF;

    IF v_coef_hor IS NULL OR v_coef_hor <= 0 THEN
        v_coef_hor := 1.0;
    END IF;

    IF v_multiplicateur IS NULL OR v_multiplicateur <= 0 THEN
        v_multiplicateur := 1.0;
    END IF;

    NEW.vol_hor_cal := ROUND(v_nb_sequences * v_coef_hor * v_multiplicateur, 2);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
SQL);

        DB::unprepared(<<<'SQL'
CREATE TRIGGER trg_calc_vol_hor
    BEFORE INSERT OR UPDATE OF id_cours, id_niv_complex, id_typ_activite
    ON activite_pedagogique
    FOR EACH ROW
    EXECUTE FUNCTION fn_calc_vol_hor();
SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::unprepared('DROP TRIGGER IF EXISTS trg_calc_vol_hor ON activite_pedagogique;');
        DB::unprepared('DROP FUNCTION IF EXISTS fn_calc_vol_hor();');
    }
};
