<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('type_ressource', function (Blueprint $table) {
            $table->foreignId('id_niv_complex')
                ->nullable()
                ->after('typ_res')
                ->constrained('niveaux_complexite', 'id_niv_complex')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('type_ressource', function (Blueprint $table) {
            $table->dropForeign(['id_niv_complex']);
            $table->dropColumn('id_niv_complex');
        });
    }
};
