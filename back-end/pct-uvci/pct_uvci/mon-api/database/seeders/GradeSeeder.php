<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GradeSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('grades')->insert([
            [
                'lib_grade' => 'Professeur Titulaire',
                'taux_hor_permanent' => 15000,
                'taux_hor_vacataire' => 20000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'lib_grade' => 'Maître de Conférences',
                'taux_hor_permanent' => 10000,
                'taux_hor_vacataire' => 15000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'lib_grade' => 'Maître-Assistant',
                'taux_hor_permanent' => 10000,
                'taux_hor_vacataire' => 15000,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'lib_grade' => 'Assistant',
                'taux_hor_permanent' => 7500,
                'taux_hor_vacataire' => 12500,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
