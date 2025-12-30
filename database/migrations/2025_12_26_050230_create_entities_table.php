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
        Schema::create('entities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('parent_entity_id')->nullable();
            $table->string('name');
            $table->string('category'); // 'ASSET', 'HEALTH', 'EDUCATION', 'FINANCE', 'PROJECT'
            $table->string('status')->default('ACTIVE');
            $table->jsonb('metadata')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::table('entities', function (Blueprint $table) {
            $table->foreign('parent_entity_id')->references('id')->on('entities')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entities');
    }
};
