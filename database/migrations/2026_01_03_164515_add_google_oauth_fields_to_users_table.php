<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id')->nullable()->unique()->index();
            $table->text('google_token')->nullable(); // Encrypted via accessor
            $table->text('google_refresh_token')->nullable(); // Encrypted via accessor
            $table->timestamp('google_token_expires_at')->nullable();
            $table->json('google_scopes')->nullable(); // Audit trail
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'google_id',
                'google_token',
                'google_refresh_token',
                'google_token_expires_at',
                'google_scopes',
            ]);
        });
    }
};
