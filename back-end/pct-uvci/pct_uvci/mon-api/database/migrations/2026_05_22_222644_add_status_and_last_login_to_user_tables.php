<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('administrateur', function (Blueprint $table) {
            $table->string('status')->default('ACTIF');
            $table->timestamp('last_login_at')->nullable();
        });

        Schema::table('secretaire_principal', function (Blueprint $table) {
            $table->string('status')->default('ACTIF');
            $table->timestamp('last_login_at')->nullable();
        });

        Schema::table('enseignants', function (Blueprint $table) {
            $table->string('status')->default('ACTIF');
            $table->timestamp('last_login_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('administrateur', function (Blueprint $table) {
            $table->dropColumn(['status', 'last_login_at']);
        });

        Schema::table('secretaire_principal', function (Blueprint $table) {
            $table->dropColumn(['status', 'last_login_at']);
        });

        Schema::table('enseignants', function (Blueprint $table) {
            $table->dropColumn(['status', 'last_login_at']);
        });
    }
};
