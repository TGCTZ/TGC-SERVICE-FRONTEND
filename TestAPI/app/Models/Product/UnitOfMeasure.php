<?php

namespace App\Models\Product;

use App\Models\Traits\HasAudit;
use App\Observers\AuditObserver;
use Database\Factories\Product\UnitOfMeasureFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy(AuditObserver::class)]
class UnitOfMeasure extends Model
{
    use HasAudit;

    /** @use HasFactory<UnitOfMeasureFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /** @var array<int, string> */
    public array $searchable = ['name', 'code', 'description'];

    /** @var array<int, string> */
    public array $filterable = ['is_active'];

    /** @var array<int, string> */
    public array $sortable = ['id', 'name', 'code', 'is_active', 'created_at'];

    /** @var array<int, string> */
    public array $includable = ['creator'];

    // region Relation
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
    // endregion
}
