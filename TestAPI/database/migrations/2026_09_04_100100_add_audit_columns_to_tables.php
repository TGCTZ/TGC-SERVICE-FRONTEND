<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tables that already carry created_by and now gain the rest of the
     * audit-stamp trio.
     *
     * @var array<int, string>
     */
    private array $tables = [
        'users',
        'user_statuses',
        'identity_details',
        'genders',
        'product_categories',
        'brands',
        'product_statuses',
        'unit_of_measures',
        'tags',
        'products',
        'product_images',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->tables as $name) {
            Schema::table($name, function (Blueprint $table) {
                // nullOnDelete so removing a user never blocks or rewrites the
                // records they touched; the activity log keeps the full story.
                $table->foreignId('updated_by')->nullable()->after('created_by')
                    ->constrained('users')->nullOnDelete();
                $table->foreignId('deleted_by')->nullable()->after('updated_by')
                    ->constrained('users')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->dropConstrainedForeignKey('updated_by');
                $table->dropConstrainedForeignKey('deleted_by');
            });
        }
    }
};
