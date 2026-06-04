<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        DB::table('administrateur')->updateOrInsert([
            'user_log_adm' => 'admin',
        ], [
            'user_pasw_adm' => Hash::make('password123'),
            'ann_aca' => 2026,
            'rol_usr' => 'administrateur',
            'para_cal' => 1,
            'coef_niv' => 1,
            'taux_hor' => 5000,
            'nom_adm' => 'Admin',
            'pren_adm' => 'UVCI',
            'email_adm' => 'admin@uvci.test',
            'status' => 'ACTIF',
        ]);

        DB::table('secretaire_principal')->updateOrInsert([
            'user_log_sp' => 'secretaire',
        ], [
            'user_log_adm' => 'admin',
            'user_pasw_sp' => Hash::make('password123'),
            'nom_sp' => 'Secretaire',
            'pren_sp' => 'UVCI',
            'email_sp' => 'secretaire@uvci.test',
            'rol_sp' => 'secretaire',
            'status' => 'ACTIF',
        ]);

        DB::table('grades')->updateOrInsert([
            'lib_grade' => 'Assistant',
        ], [
            'taux_hor_permanent' => 7500,
            'taux_hor_vacataire' => 12500,
            'quota_annuel' => 192,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('statut')->updateOrInsert([
            'lib_statut' => 'Permanent',
        ]);

        DB::table('departement')->updateOrInsert([
            'lib_depart' => 'Informatique',
        ]);

        foreach (['L1', 'L2', 'L3', 'M1', 'M2'] as $niveau) {
            DB::table('niveau_etude')->updateOrInsert([
                'lib_niveau' => $niveau,
            ]);
        }

        foreach ([
            ['lib_niv_complex' => 'N1 - Simple', 'description' => 'Production à complexité simple.', 'coeff_niv_complex' => 0.40],
            ['lib_niv_complex' => 'N2 - Moyen', 'description' => 'Production à complexité moyenne.', 'coeff_niv_complex' => 0.75],
            ['lib_niv_complex' => 'N3 - Complexe', 'description' => 'Production à complexité élevée.', 'coeff_niv_complex' => 1.50],
        ] as $niveauComplexite) {
            DB::table('niveaux_complexite')->updateOrInsert([
                'lib_niv_complex' => $niveauComplexite['lib_niv_complex'],
            ], [
                'user_log_adm' => 'admin',
                'description' => $niveauComplexite['description'],
                'coeff_niv_complex' => $niveauComplexite['coeff_niv_complex'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach ([
            ['lib_activite' => 'Création', 'multiplicateur_base' => 1.00],
            ['lib_activite' => 'Mise à jour', 'multiplicateur_base' => 0.50],
        ] as $typeActivite) {
            DB::table('type_activite')->updateOrInsert([
                'lib_activite' => $typeActivite['lib_activite'],
            ], [
                'multiplicateur_base' => $typeActivite['multiplicateur_base'],
            ]);
        }

        $idGrade = DB::table('grades')->where('lib_grade', 'Assistant')->value('id_grade');
        $idStatut = DB::table('statut')->where('lib_statut', 'Permanent')->value('id_statut');
        $idDepart = DB::table('departement')->where('lib_depart', 'Informatique')->value('id_depart');

        DB::table('enseignants')->updateOrInsert([
            'user_log_ens' => 'enseignant',
        ], [
            'user_log_adm' => 'admin',
            'user_log_sp' => 'secretaire',
            'id_grade' => $idGrade,
            'id_statut' => $idStatut,
            'id_depart' => $idDepart,
            'user_pasw_ens' => Hash::make('password123'),
            'nom_ens' => 'Enseignant',
            'pren_ens' => 'Test',
            'email_ens' => 'enseignant@uvci.test',
            'tel_ens' => '0102030405',
            'taux_hor_ens' => 7500,
            'status' => 'ACTIF',
        ]);
    }
}
