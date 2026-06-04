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

        DB::statement('ALTER TABLE sessions ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text');
        DB::statement('ALTER TABLE grade_history ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text');
        DB::statement('ALTER TABLE complexity_history ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE sessions ALTER COLUMN user_id TYPE BIGINT USING NULLIF(user_id, \'\')::bigint');
        DB::statement('ALTER TABLE grade_history ALTER COLUMN user_id TYPE BIGINT USING NULLIF(user_id, \'\')::bigint');
        DB::statement('ALTER TABLE complexity_history ALTER COLUMN user_id TYPE BIGINT USING NULLIF(user_id, \'\')::bigint');
    }
};
