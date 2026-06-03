<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop FK pointing to the old `grade` (singular) table
        Schema::table('enseignants', function ($table) {
            $table->dropForeign(['id_grade']);
        });

        // Re-add FK pointing to the correct `grades` (plural) table
        DB::statement('ALTER TABLE enseignants ADD CONSTRAINT enseignants_id_grade_foreign FOREIGN KEY (id_grade) REFERENCES grades(id_grade) ON DELETE RESTRICT');
    }

    public function down(): void
    {
        Schema::table('enseignants', function ($table) {
            $table->dropForeign(['id_grade']);
        });

        DB::statement('ALTER TABLE enseignants ADD CONSTRAINT enseignants_id_grade_foreign FOREIGN KEY (id_grade) REFERENCES grade(id_grade) ON DELETE RESTRICT');
    }
};
