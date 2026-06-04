<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('administrateur', function (Blueprint $table) {
            if (! Schema::hasColumn('administrateur', 'nom_adm')) {
                $table->string('nom_adm', 100)->nullable()->after('taux_hor');
            }
            if (! Schema::hasColumn('administrateur', 'pren_adm')) {
                $table->string('pren_adm', 100)->nullable()->after('nom_adm');
            }
            if (! Schema::hasColumn('administrateur', 'email_adm')) {
                $table->string('email_adm', 150)->nullable()->after('pren_adm');
            }
        });
    }

    public function down(): void
    {
        Schema::table('administrateur', function (Blueprint $table) {
            $table->dropColumn(['nom_adm', 'pren_adm', 'email_adm']);
        });
    }
};
