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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            // Event
            $table->string('event');
            $table->string('description')->nullable();

            // Subject - the record the event happened to. Nullable because
            // auth events (login, login_failed) have no model subject.
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            // Denormalised on purpose: the log must stay readable after the
            // subject is deleted, when the label can no longer be looked up.
            $table->string('subject_label')->nullable();

            // Actor. nullOnDelete rather than the codebase's usual restrict:
            // deleting a user must neither be blocked by their history nor
            // erase it.
            $table->foreignId('causer_id')->nullable()->constrained('users')
                ->nullOnDelete();
            $table->string('causer_label')->nullable();

            // Diff - only the attributes that actually changed.
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();

            // Request context
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('method', 10)->nullable();
            $table->text('url')->nullable();
            // Groups every row written during one request, so a cascade of
            // related changes can be read back as a single action.
            $table->uuid('batch_uuid')->nullable();

            // No updated_at and no softDeletes: an audit row is immutable.
            $table->timestamp('created_at')->nullable();

            $table->index(['subject_type', 'subject_id']);
            $table->index('causer_id');
            $table->index('event');
            $table->index('created_at');
            $table->index('batch_uuid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
