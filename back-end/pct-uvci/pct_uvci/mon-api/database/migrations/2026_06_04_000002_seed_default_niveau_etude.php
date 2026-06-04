<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('niveau_etude')) {
            return;
        }

        if (DB::table('niveau_etude')->exists()) {
            return;
        }

        DB::table('niveau_etude')->insert([
            ['lib_niveau' => 'L1'],
            ['lib_niveau' => 'L2'],
            ['lib_niveau' => 'L3'],
            ['lib_niveau' => 'M1'],
            ['lib_niveau' => 'M2'],
        ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('niveau_etude')) {
            return;
        }

        DB::table('niveau_etude')
            ->whereIn('lib_niveau', ['L1', 'L2', 'L3', 'M1', 'M2'])
            ->delete();
    }
};
