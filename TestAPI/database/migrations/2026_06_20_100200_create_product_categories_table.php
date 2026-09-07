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
        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            // Self-referencing parent lets the UI render a category tree /
            // cascading select. Nullable = a top-level category.
            $table->foreignId('parent_id')->nullable()->constrained(
                'product_categories'
            )->nullOnDelete();

            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained(
                'users'
            )->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_categories');
    }
};
