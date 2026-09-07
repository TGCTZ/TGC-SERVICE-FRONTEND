<?php

namespace App\Models\Product;

use App\Models\Traits\HasAudit;
use App\Observers\AuditObserver;
use Database\Factories\Product\ProductCategoryFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy(AuditObserver::class)]
class ProductCategory extends Model
{
    use HasAudit;

    /** @use HasFactory<ProductCategoryFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'parent_id',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /** @var array<int, string> */
    public array $searchable = ['name', 'slug', 'description'];

    /** @var array<int, string> */
    public array $filterable = ['is_active', 'parent_id'];

    /** @var array<int, string> */
    public array $sortable = ['id', 'name', 'is_active', 'created_at'];

    /** @var array<int, string> */
    public array $includable = ['parent', 'children', 'creator'];

    // region Relation
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
    // endregion
}
