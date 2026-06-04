<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('activite_pedagogique') || ! Schema::hasColumn('activite_pedagogique', 'id_res')) {
            return;
        }

        match (DB::getDriverName()) {
            'pgsql' => DB::statement('ALTER TABLE activite_pedagogique ALTER COLUMN id_res DROP NOT NULL'),
            'mysql' => DB::statement('ALTER TABLE activite_pedagogique MODIFY id_res BIGINT UNSIGNED NULL'),
            default => null,
        };
    }

    public function down(): void
    {
        if (! Schema::hasTable('activite_pedagogique') || ! Schema::hasColumn('activite_pedagogique', 'id_res')) {
            return;
        }

        match (DB::getDriverName()) {
            'pgsql' => DB::statement('ALTER TABLE activite_pedagogique ALTER COLUMN id_res SET NOT NULL'),
            'mysql' => DB::statement('ALTER TABLE activite_pedagogique MODIFY id_res BIGINT UNSIGNED NOT NULL'),
            default => null,
        };
    }
};
