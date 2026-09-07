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
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // Identity
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sku')->unique();
            $table->string('barcode')->nullable();

            // Text
            $table->string('short_description')->nullable();
            $table->text('description')->nullable();

            // Relations (lookups)
            $table->foreignId('product_category_id')->constrained()
                ->onDelete('cascade');
            $table->foreignId('brand_id')->nullable()->constrained()
                ->nullOnDelete();
            $table->foreignId('product_status_id')->constrained()
                ->onDelete('cascade');
            $table->foreignId('unit_of_measure_id')->nullable()->constrained()
                ->nullOnDelete();

            // Money
            $table->decimal('price', 12, 2);
            $table->decimal('cost_price', 12, 2)->nullable();
            $table->decimal('discount_percentage', 5, 2)->nullable();
            $table->decimal('tax_rate', 5, 2)->nullable();
            $table->string('currency', 3)->default('USD');

            // Numbers
            $table->integer('stock_quantity')->default(0);
            $table->integer('reorder_level')->nullable();
            $table->decimal('weight', 8, 3)->nullable();
            $table->decimal('length', 8, 2)->nullable();
            $table->decimal('width', 8, 2)->nullable();
            $table->decimal('height', 8, 2)->nullable();
            $table->integer('warranty_months')->nullable();
            $table->decimal('rating', 3, 2)->nullable();

            // Booleans
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_digital')->default(false);
            $table->boolean('requires_shipping')->default(true);

            // Dates
            $table->date('released_at')->nullable();
            $table->timestamp('available_from')->nullable();
            $table->date('expiry_date')->nullable();

            // Structured data (key/value editors in the UI)
            $table->json('specifications')->nullable();
            $table->json('metadata')->nullable();

            // Assorted input types
            $table->string('color')->nullable();
            $table->string('website_url')->nullable();
            $table->string('contact_email')->nullable();

            // Main image (column shape mirrors product_images)
            $table->string('image_path')->nullable();
            $table->string('original_image_name')->nullable();
            $table->unsignedBigInteger('image_size')->nullable();
            $table->string('mime_type')->nullable();

            $table->foreignId('created_by')->nullable()->constrained(
                'users'
            )->onDelete('restrict');
            $table->timestamps();
            $table->softDeletes();

            // Indexes backing the searchable/filterable/sortable whitelists.
            $table->index('name');
            $table->index('price');
            $table->index('stock_quantity');
            $table->index('is_active');
            $table->index('is_featured');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
