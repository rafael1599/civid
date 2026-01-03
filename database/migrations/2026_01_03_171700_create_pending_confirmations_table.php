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
        Schema::create('pending_confirmations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('source_type'); // 'gmail' or 'calendar'
            $table->string('source_id')->unique(); // Hash to prevent duplicates
            $table->string('source_external_id'); // Original Gmail/Calendar ID
            $table->json('raw_data'); // Original email/event data
            $table->json('extracted_data'); // AI-extracted fields
            $table->integer('confidence_score')->default(0); // 0-100
            $table->boolean('requires_manual_review')->default(false);
            $table->string('review_reason')->nullable();
            $table->string('status')->default('pending'); // pending, confirmed, discarded
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('source_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pending_confirmations');
    }
};
