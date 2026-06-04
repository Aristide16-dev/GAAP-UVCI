<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('niveaux_complexite') && ! DB::table('niveaux_complexite')->exists()) {
            $adminLogin = DB::table('administrateur')->value('user_log_adm');

            DB::table('niveaux_complexite')->insert([
                [
                    'user_log_adm' => $adminLogin,
                    'lib_niv_complex' => 'N1 - Simple',
                    'description' => 'Production à complexité simple.',
                    'coeff_niv_complex' => 0.40,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'user_log_adm' => $adminLogin,
                    'lib_niv_complex' => 'N2 - Moyen',
                    'description' => 'Production à complexité moyenne.',
                    'coeff_niv_complex' => 0.75,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'user_log_adm' => $adminLogin,
                    'lib_niv_complex' => 'N3 - Complexe',
                    'description' => 'Production à complexité élevée.',
                    'coeff_niv_complex' => 1.50,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        if (Schema::hasTable('type_activite') && ! DB::table('type_activite')->exists()) {
            DB::table('type_activite')->insert([
                ['lib_activite' => 'Création', 'multiplicateur_base' => 1.00],
                ['lib_activite' => 'Mise à jour', 'multiplicateur_base' => 0.50],
            ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('type_activite')) {
            DB::table('type_activite')
                ->whereIn('lib_activite', ['Création', 'Mise à jour'])
                ->delete();
        }

        if (Schema::hasTable('niveaux_complexite')) {
            DB::table('niveaux_complexite')
                ->whereIn('lib_niv_complex', ['N1 - Simple', 'N2 - Moyen', 'N3 - Complexe'])
                ->delete();
        }
    }
};
