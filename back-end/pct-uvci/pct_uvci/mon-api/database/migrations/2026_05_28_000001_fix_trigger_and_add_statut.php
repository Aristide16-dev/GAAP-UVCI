<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('activite_pedagogique', 'statut')) {
            Schema::table('activite_pedagogique', function (Blueprint $table) {
                $table->string('statut', 20)->default('en_attente')->after('vol_hor_cal');
            });
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION fn_calc_vol_hor()
RETURNS TRIGGER AS $$
DECLARE
    v_nb_sequences INTEGER;
    v_coef_hor     NUMERIC;
    v_multiplicateur NUMERIC;
BEGIN
    SELECT nb_heures * 4 INTO v_nb_sequences
    FROM cours WHERE id_cours = NEW.id_cours;

    SELECT coeff_niv_complex INTO v_coef_hor
    FROM niveaux_complexite WHERE id_niv_complex = NEW.id_niv_complex;

    SELECT multiplicateur_base INTO v_multiplicateur
    FROM type_activite WHERE id_typ_activite = NEW.id_typ_activite;

    NEW.vol_hor_cal := COALESCE(v_nb_sequences, 0)
                     * COALESCE(v_coef_hor, 1.0)
                     * COALESCE(v_multiplicateur, 1.0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
SQL);
        }
    }

    public function down(): void
    {
        Schema::table('activite_pedagogique', function (Blueprint $table) {
            $table->dropColumn('statut');
        });
    }
};
