<?php

namespace App\Models\Audit;

use App\Models\User\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One immutable record of something that happened.
 *
 * Deliberately has no SoftDeletes, no HasAudit and no updated_at: a mutable
 * audit row is not an audit row. Rows are written only by AuditLogger.
 */
class ActivityLog extends Model
{
    /** Audit rows are never updated, so only created_at is maintained. */
    public const UPDATED_AT = null;

    protected $fillable = [
        'event',
        'description',
        'subject_type',
        'subject_id',
        'subject_label',
        'causer_id',
        'causer_label',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'method',
        'url',
        'batch_uuid',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'subject_id' => 'integer',
        'created_at' => 'datetime',
    ];

    /** @var array<int, string> */
    public array $searchable = [
        'description',
        'subject_label',
        'causer_label',
        'event',
    ];

    /** @var array<int, string> */
    public array $filterable = [
        'event',
        'causer_id',
        'subject_type',
        'subject_id',
        'batch_uuid',
    ];

    /** @var array<int, string> */
    public array $sortable = ['id', 'event', 'created_at'];

    /** @var array<int, string> */
    public array $includable = ['causer'];

    /** @var array<int, string> */
    public array $dateFilterable = ['created_at'];

    // region Relation
    public function causer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'causer_id');
    }
    // endregion
}
