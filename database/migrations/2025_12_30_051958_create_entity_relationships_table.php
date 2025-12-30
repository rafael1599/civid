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
        Schema::create('entity_relationships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('parent_entity_id')->constrained('entities')->onDelete('cascade');
            $table->foreignUuid('child_entity_id')->constrained('entities')->onDelete('cascade');

            // Flexible relationship type: covers, finances, pays_from, linked_to, depends_on, etc.
            $table->string('relationship_type', 50);

            // Metadata for additional details (e.g., coverage %, priority)
            $table->json('metadata')->nullable();

            $table->timestamps();

            // Prevent duplicates: A specific link between two entities should only exist once
            $table->unique(['parent_entity_id', 'child_entity_id', 'relationship_type'], 'unique_relationship');

            // Indexes for fast ecosystem queries
            $table->index('parent_entity_id');
            $table->index('child_entity_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entity_relationships');
    }
};
