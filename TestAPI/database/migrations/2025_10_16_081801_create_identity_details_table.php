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
        Schema::create('identity_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('id_type')->nullable();
            $table->string('id_number')->nullable();
            $table->string('id_document_path')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->date('expiry_date')->nullable();
            $table->date('issue_date')->nullable();
            $table->string('issue_country')->nullable();
            $table->foreignId('created_by')->nullable()->constrained(
                'users'
            )->onDelete('restrict');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('identity_details');
    }
};
