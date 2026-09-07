<?php

namespace App\Models\Traits;

use App\Models\User\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * Stamps who created, updated and deleted a record, and declares the contract
 * the AuditObserver reads when writing activity-log rows.
 *
 * The stamps are a denormalised convenience - "who last touched this?" without
 * querying the log. The activity log remains the authoritative history.
 *
 * Applying this trait alone does not produce log rows; add
 * #[ObservedBy(AuditObserver::class)] to the model for that.
 */
trait HasAudit
{
    /**
     * Boot the HasAudit trait for a model.
     */
    protected static function bootHasAudit(): void
    {
        static::creating(function (Model $model): void {
            if (Auth::check() && ! $model->created_by) {
                $model->created_by = Auth::id();
            }
        });

        static::updating(function (Model $model): void {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });

        static::deleting(function (Model $model): void {
            // The app only ever soft-deletes, but forceDelete() remains
            // callable from code, and stamping a row that is about to vanish
            // is pointless. saveQuietly avoids re-entering the update events
            // (and the observer) for what is really part of the delete.
            if (Auth::check() && method_exists($model, 'isForceDeleting')
                && ! $model->isForceDeleting()) {
                $model->deleted_by = Auth::id();
                $model->saveQuietly();
            }
        });

        static::restoring(function (Model $model): void {
            // Clearing the stamp keeps it honest: a restored record has not
            // been deleted by anyone.
            $model->deleted_by = null;
        });
    }

    /**
     * The user who created this record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The user who last updated this record.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * The user who soft-deleted this record.
     */
    public function deleter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    /**
     * Attributes never written to the activity log.
     *
     * Secrets must not leak into a table that is, by design, widely readable -
     * a hashed password is still a hash worth attacking. Timestamps are noise:
     * the log row carries its own created_at.
     *
     * @return array<int, string>
     */
    public function auditExclude(): array
    {
        return [
            'password',
            'remember_token',
            'created_at',
            'updated_at',
            'deleted_at',
            'created_by',
            'updated_by',
            'deleted_by',
        ];
    }

    /**
     * Human-readable name for this record, snapshotted onto the log row so it
     * survives the record being deleted.
     */
    public function auditLabel(): string
    {
        foreach (['name', 'title', 'label'] as $attribute) {
            $value = $this->getAttribute($attribute);

            if (is_string($value) && $value !== '') {
                return $value;
            }
        }

        return '#'.$this->getKey();
    }
}
