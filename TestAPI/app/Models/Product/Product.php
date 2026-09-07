<?php

namespace App\Models\Product;

use App\Models\Traits\HasAudit;
use App\Observers\AuditObserver;
use Database\Factories\Product\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy(AuditObserver::class)]
class Product extends Model
{
    use HasAudit;

    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'sku',
        'barcode',
        'short_description',
        'description',
        'product_category_id',
        'brand_id',
        'product_status_id',
        'unit_of_measure_id',
        'price',
        'cost_price',
        'discount_percentage',
        'tax_rate',
        'currency',
        'stock_quantity',
        'reorder_level',
        'weight',
        'length',
        'width',
        'height',
        'warranty_months',
        'rating',
        'is_active',
        'is_featured',
        'is_digital',
        'requires_shipping',
        'released_at',
        'available_from',
        'expiry_date',
        'specifications',
        'metadata',
        'color',
        'website_url',
        'contact_email',
        'image_path',
        'original_image_name',
        'image_size',
        'mime_type',
        'created_by',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'weight' => 'decimal:3',
        'length' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'rating' => 'decimal:2',
        'stock_quantity' => 'integer',
        'reorder_level' => 'integer',
        'warranty_months' => 'integer',
        'image_size' => 'integer',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'is_digital' => 'boolean',
        'requires_shipping' => 'boolean',
        'released_at' => 'date',
        'available_from' => 'datetime',
        'expiry_date' => 'date',
        'specifications' => 'array',
        'metadata' => 'array',
    ];

    /** @var array<int, string> */
    public array $searchable = [
        'name',
        'sku',
        'barcode',
        'short_description',
        'description',
    ];

    /** @var array<int, string> */
    public array $filterable = [
        'product_category_id',
        'brand_id',
        'product_status_id',
        'unit_of_measure_id',
        'is_active',
        'is_featured',
        'is_digital',
        'requires_shipping',
        'currency',
    ];

    /** @var array<int, string> */
    public array $sortable = [
        'id',
        'name',
        'sku',
        'price',
        'stock_quantity',
        'rating',
        'is_featured',
        'released_at',
        'created_at',
    ];

    /** @var array<int, string> */
    public array $includable = [
        'productCategory',
        'brand',
        'productStatus',
        'unitOfMeasure',
        'tags',
        'images',
        'creator',
    ];

    // region Relation
    public function productCategory(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function productStatus(): BelongsTo
    {
        return $this->belongsTo(ProductStatus::class);
    }

    public function unitOfMeasure(): BelongsTo
    {
        return $this->belongsTo(UnitOfMeasure::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class)->withTimestamps();
    }

    /**
     * Gallery images. Ordering is applied where the relation is loaded rather
     * than here, so the return type stays a true HasMany relation.
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }
    // endregion
}
