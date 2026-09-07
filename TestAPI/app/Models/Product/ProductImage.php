<?php

namespace App\Models\Product;

use App\Models\Traits\HasAudit;
use App\Observers\AuditObserver;
use Database\Factories\Product\ProductImageFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy(AuditObserver::class)]
class ProductImage extends Model
{
    use HasAudit;

    /** @use HasFactory<ProductImageFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'product_id',
        'image_path',
        'original_image_name',
        'image_size',
        'mime_type',
        'alt_text',
        'sort_order',
        'is_primary',
        'created_by',
    ];

    protected $casts = [
        'image_size' => 'integer',
        'sort_order' => 'integer',
        'is_primary' => 'boolean',
    ];

    /** @var array<int, string> */
    public array $searchable = ['alt_text', 'original_image_name'];

    /** @var array<int, string> */
    public array $filterable = ['product_id', 'is_primary'];

    /** @var array<int, string> */
    public array $sortable = ['id', 'sort_order', 'created_at'];

    /** @var array<int, string> */
    public array $includable = ['product', 'creator'];

    // region Relation
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
    // endregion
}
