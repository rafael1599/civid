<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('life_events', function (Blueprint $table) {
            $table->uuid('from_entity_id')->nullable()->after('entity_id')->index();
            $table->uuid('to_entity_id')->nullable()->after('from_entity_id')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('life_events', function (Blueprint $table) {
            $table->dropColumn(['from_entity_id', 'to_entity_id']);
        });
    }
};
