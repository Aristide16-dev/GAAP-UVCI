<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop FK before altering column
        Schema::table('enseignants', function ($table) {
            $table->dropForeign(['user_log_sp']);
        });

        // Make nullable (PostgreSQL syntax)
        DB::statement('ALTER TABLE enseignants ALTER COLUMN user_log_sp DROP NOT NULL');

        // Recreate FK with SET NULL on delete
        DB::statement('ALTER TABLE enseignants ADD CONSTRAINT enseignants_user_log_sp_foreign FOREIGN KEY (user_log_sp) REFERENCES secretaire_principal(user_log_sp) ON DELETE SET NULL');
    }

    public function down(): void
    {
        Schema::table('enseignants', function ($table) {
            $table->dropForeign(['user_log_sp']);
        });

        DB::statement('ALTER TABLE enseignants ALTER COLUMN user_log_sp SET NOT NULL');

        DB::statement('ALTER TABLE enseignants ADD CONSTRAINT enseignants_user_log_sp_foreign FOREIGN KEY (user_log_sp) REFERENCES secretaire_principal(user_log_sp) ON DELETE CASCADE');
    }
};
