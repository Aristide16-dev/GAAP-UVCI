<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade', function (Blueprint $table): void {
            $table->id('id_grade');
            $table->string('lib_grade', 100);
        });

        Schema::create('statut', function (Blueprint $table): void {
            $table->id('id_statut');
            $table->string('lib_statut', 100);
        });

        Schema::create('departement', function (Blueprint $table): void {
            $table->id('id_depart');
            $table->string('lib_depart', 150);
        });

        Schema::create('administrateur', function (Blueprint $table): void {
            $table->string('user_log_adm', 50)->primary();
            $table->string('user_pasw_adm');
            $table->integer('ann_aca');
            $table->string('rol_usr', 50);
            $table->decimal('para_cal', 10, 2);
            $table->decimal('coef_niv', 10, 2);
            $table->decimal('taux_hor', 10, 2);
        });

        Schema::create('secretaire_principal', function (Blueprint $table): void {
            $table->string('user_log_sp', 50)->primary();
            $table->string('user_log_adm', 50)->index();
            $table->string('user_pasw_sp');
            $table->string('nom_sp', 100);
            $table->string('pren_sp', 100);
            $table->string('email_sp', 150)->unique();
            $table->string('rol_sp', 50);

            $table->foreign('user_log_adm')->references('user_log_adm')->on('administrateur')->cascadeOnDelete();
        });

        Schema::create('enseignants', function (Blueprint $table): void {
            $table->id('id_ens');
            $table->string('user_log_adm', 50)->index();
            $table->string('user_log_sp', 50)->index();
            $table->foreignId('id_grade')->constrained('grade', 'id_grade')->restrictOnDelete();
            $table->foreignId('id_statut')->constrained('statut', 'id_statut')->restrictOnDelete();
            $table->foreignId('id_depart')->constrained('departement', 'id_depart')->restrictOnDelete();
            $table->string('user_log_ens', 50)->unique();
            $table->string('user_pasw_ens');
            $table->string('nom_ens', 100);
            $table->string('pren_ens', 100);
            $table->string('email_ens', 150)->unique();
            $table->string('tel_ens', 20);
            $table->decimal('taux_hor_ens', 10, 2);

            $table->foreign('user_log_adm')->references('user_log_adm')->on('administrateur')->restrictOnDelete();
            $table->foreign('user_log_sp')->references('user_log_sp')->on('secretaire_principal')->cascadeOnDelete();
        });

        Schema::create('niveau_etude', function (Blueprint $table): void {
            $table->id('id_niveau');
            $table->string('lib_niveau', 100);
        });

        Schema::create('cours', function (Blueprint $table): void {
            $table->id('id_cours');
            $table->foreignId('id_niveau')->constrained('niveau_etude', 'id_niveau')->restrictOnDelete();
            $table->string('int_cours', 150);
            $table->string('filiere', 100);
            $table->string('semestre', 50);
            $table->integer('nb_heures');
            $table->integer('nb_credits');
        });

        Schema::create('sequence_cours', function (Blueprint $table): void {
            $table->id('id_seq');
            $table->foreignId('id_cours')->constrained('cours', 'id_cours')->cascadeOnDelete();
            $table->string('titre_seq', 150);
        });

        Schema::create('type_ressource', function (Blueprint $table): void {
            $table->id('id_typ_res');
            $table->string('typ_res', 100);
        });

        Schema::create('ressource', function (Blueprint $table): void {
            $table->id('id_res');
            $table->foreignId('id_seq')->constrained('sequence_cours', 'id_seq')->cascadeOnDelete();
            $table->foreignId('id_typ_res')->constrained('type_ressource', 'id_typ_res')->restrictOnDelete();
            $table->foreignId('id_cours')->constrained('cours', 'id_cours')->restrictOnDelete();
            $table->string('titre_res', 150);
        });

        Schema::create('niveau_complexite', function (Blueprint $table): void {
            $table->id('id_niv_complex');
            $table->string('user_log_adm', 50)->index();
            $table->string('lib_niveau', 100);
            $table->text('description');
            $table->decimal('coef_hor', 10, 2);

            $table->foreign('user_log_adm')->references('user_log_adm')->on('administrateur')->restrictOnDelete();
        });

        Schema::create('type_activite', function (Blueprint $table): void {
            $table->id('id_typ_activite');
            $table->string('lib_activite', 100);
            $table->decimal('multiplicateur_base', 10, 2)->default(1);
        });

        Schema::create('parametre', function (Blueprint $table): void {
            $table->id('id_param');
            $table->string('user_log_adm', 50)->index();
            $table->integer('annee_acad');
            $table->decimal('taux_hor_defaut', 10, 2);
            $table->date('date_debut');
            $table->date('date_fin');

            $table->foreign('user_log_adm')->references('user_log_adm')->on('administrateur')->restrictOnDelete();
        });

        Schema::create('activite_pedagogique', function (Blueprint $table): void {
            $table->id('id_activite');
            $table->foreignId('id_ens')->constrained('enseignants', 'id_ens')->restrictOnDelete();
            $table->string('user_log_sp', 50)->index();
            $table->foreignId('id_res')->constrained('ressource', 'id_res')->restrictOnDelete();
            $table->foreignId('id_cours')->constrained('cours', 'id_cours')->restrictOnDelete();
            $table->foreignId('id_param')->constrained('parametre', 'id_param')->restrictOnDelete();
            $table->foreignId('id_niv_complex')->constrained('niveau_complexite', 'id_niv_complex')->restrictOnDelete();
            $table->foreignId('id_typ_activite')->constrained('type_activite', 'id_typ_activite')->restrictOnDelete();
            $table->date('date_saisie')->default(DB::raw('CURRENT_DATE'));
            $table->decimal('vol_hor_cal', 10, 2)->default(0);

            $table->foreign('user_log_sp')->references('user_log_sp')->on('secretaire_principal')->restrictOnDelete();
        });

        if (DB::getDriverName() === 'pgsql') {
            $this->createPostgresTriggers();
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared('DROP TRIGGER IF EXISTS trg_calc_vol_hor ON activite_pedagogique');
            DB::unprepared('DROP FUNCTION IF EXISTS fn_calc_vol_hor()');
            DB::unprepared('DROP TRIGGER IF EXISTS trg_check_nb_sequences ON sequence_cours');
            DB::unprepared('DROP FUNCTION IF EXISTS fn_check_nb_sequences()');
        }

        Schema::dropIfExists('activite_pedagogique');
        Schema::dropIfExists('parametre');
        Schema::dropIfExists('type_activite');
        Schema::dropIfExists('niveau_complexite');
        Schema::dropIfExists('ressource');
        Schema::dropIfExists('type_ressource');
        Schema::dropIfExists('sequence_cours');
        Schema::dropIfExists('cours');
        Schema::dropIfExists('niveau_etude');
        Schema::dropIfExists('enseignants');
        Schema::dropIfExists('secretaire_principal');
        Schema::dropIfExists('administrateur');
        Schema::dropIfExists('departement');
        Schema::dropIfExists('statut');
        Schema::dropIfExists('grade');
    }

    private function createPostgresTriggers(): void
    {
        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION fn_calc_vol_hor()
RETURNS TRIGGER AS $$
DECLARE
    v_nb_sequences INTEGER;
    v_coef_hor NUMERIC;
    v_multiplicateur NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_nb_sequences
    FROM sequence_cours
    WHERE id_cours = NEW.id_cours;

    SELECT coef_hor INTO v_coef_hor
    FROM niveau_complexite
    WHERE id_niv_complex = NEW.id_niv_complex;

    SELECT multiplicateur_base INTO v_multiplicateur
    FROM type_activite
    WHERE id_typ_activite = NEW.id_typ_activite;

    NEW.vol_hor_cal := v_nb_sequences * COALESCE(v_coef_hor, 1) * COALESCE(v_multiplicateur, 1);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calc_vol_hor
    BEFORE INSERT OR UPDATE ON activite_pedagogique
    FOR EACH ROW
    EXECUTE FUNCTION fn_calc_vol_hor();
SQL);

        DB::unprepared(<<<'SQL'
CREATE OR REPLACE FUNCTION fn_check_nb_sequences()
RETURNS TRIGGER AS $$
DECLARE
    v_nb_heures INTEGER;
    v_nb_sequences_actuelles INTEGER;
    v_max_sequences INTEGER;
BEGIN
    SELECT nb_heures INTO v_nb_heures
    FROM cours
    WHERE id_cours = NEW.id_cours;

    v_max_sequences := v_nb_heures * 4;

    SELECT COUNT(*) INTO v_nb_sequences_actuelles
    FROM sequence_cours
    WHERE id_cours = NEW.id_cours;

    IF TG_OP = 'INSERT' AND v_nb_sequences_actuelles >= v_max_sequences THEN
        RAISE EXCEPTION 'RG1 violee : le cours % a deja % sequence(s) sur un maximum de %.',
            NEW.id_cours, v_nb_sequences_actuelles, v_max_sequences;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.id_cours <> NEW.id_cours AND v_nb_sequences_actuelles >= v_max_sequences THEN
        RAISE EXCEPTION 'RG1 violee : le cours % a deja % sequence(s) sur un maximum de %.',
            NEW.id_cours, v_nb_sequences_actuelles, v_max_sequences;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_nb_sequences
    BEFORE INSERT OR UPDATE ON sequence_cours
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_nb_sequences();
SQL);
    }
};
