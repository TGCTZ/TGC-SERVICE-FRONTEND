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

            // Avatar, stored with the same column shape used for product images.
            $table->string('avatar_path')->nullable();
            $table->string('original_avatar_name')->nullable();
            $table->unsignedBigInteger('avatar_size')->nullable();
            $table->string('avatar_mime_type')->nullable();

            $table->date('date_of_birth')->nullable();
            $table->foreignId('gender_id')->nullable()->constrained()
                ->nullOnDelete();
            $table->text('bio')->nullable();

            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();

            $table->string('timezone')->nullable();
            $table->string('locale')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->boolean('is_active')->default(true);

            $table->index('is_active');
            $table->index('city');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('gender_id');

            $table->dropColumn([
                'avatar_path',
                'original_avatar_name',
                'avatar_size',
                'avatar_mime_type',
                'date_of_birth',
                'bio',
                'address_line1',
                'address_line2',
                'city',
                'state',
                'postal_code',
                'country',
                'timezone',
                'locale',
                'last_login_at',
                'is_active',
            ]);
        });
    }
};
