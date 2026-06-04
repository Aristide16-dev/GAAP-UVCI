<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complexity_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('niveau_complexite_id');
            $table->string('user_id')->nullable();
            $table->string('action');
            $table->json('old_data')->nullable();
            $table->json('new_data')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complexity_history');
    }
};
