<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cours', function (Blueprint $table) {
            $table->foreignId('id_typ_res')
                ->nullable()
                ->after('nb_credits')
                ->constrained('type_ressource', 'id_typ_res')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('cours', function (Blueprint $table) {
            $table->dropForeign(['id_typ_res']);
            $table->dropColumn('id_typ_res');
        });
    }
};
