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
        DB::statement('ALTER TABLE documents ADD COLUMN extracted_content TEXT');
        DB::statement("ALTER TABLE documents ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(extracted_content, ''))) STORED");
        DB::statement('CREATE INDEX idx_documents_search ON documents USING GIN(search_vector)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex('idx_documents_search');
            $table->dropColumn(['search_vector', 'extracted_content']);
        });
    }
};
