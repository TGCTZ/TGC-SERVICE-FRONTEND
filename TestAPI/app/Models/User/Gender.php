<?php

namespace App\Models\User;

use App\Models\Traits\HasAudit;
use App\Observers\AuditObserver;
use Database\Factories\User\GenderFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy(AuditObserver::class)]
class Gender extends Model
{
    use HasAudit;

    /** @use HasFactory<GenderFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Columns the query-filter trait is allowed to act on.
     *
     * @var array<int, string>
     */
    public array $searchable = ['name', 'description'];

    /** @var array<int, string> */
    public array $filterable = ['is_active'];

    /** @var array<int, string> */
    public array $sortable = ['id', 'name', 'is_active', 'created_at'];

    /** @var array<int, string> */
    public array $includable = ['creator'];

    // region Relation
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
    // endregion
}
