<?php

namespace App\Http\Resources\Api\V1\Product;

use App\Http\Resources\BaseResource;
use App\Models\Product\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin Product
 */
class ProductResource extends BaseResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'barcode' => $this->barcode,

            'short_description' => $this->short_description,
            'description' => $this->description,

            'product_category_id' => $this->product_category_id,
            'product_category' => new ProductCategoryResource(
                $this->whenLoaded('productCategory')
            ),
            'brand_id' => $this->brand_id,
            'brand' => new BrandResource($this->whenLoaded('brand')),
            'product_status_id' => $this->product_status_id,
            'product_status' => new ProductStatusResource(
                $this->whenLoaded('productStatus')
            ),
            'unit_of_measure_id' => $this->unit_of_measure_id,
            'unit_of_measure' => new UnitOfMeasureResource(
                $this->whenLoaded('unitOfMeasure')
            ),

            'price' => $this->price,
            'cost_price' => $this->cost_price,
            'discount_percentage' => $this->discount_percentage,
            'tax_rate' => $this->tax_rate,
            'currency' => $this->currency,

            'stock_quantity' => $this->stock_quantity,
            'reorder_level' => $this->reorder_level,
            'weight' => $this->weight,
            'length' => $this->length,
            'width' => $this->width,
            'height' => $this->height,
            'warranty_months' => $this->warranty_months,
            'rating' => $this->rating,

            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'is_digital' => $this->is_digital,
            'requires_shipping' => $this->requires_shipping,

            'released_at' => $this->released_at,
            'available_from' => $this->available_from,
            'expiry_date' => $this->expiry_date,

            'specifications' => $this->specifications,
            'metadata' => $this->metadata,

            'color' => $this->color,
            'website_url' => $this->website_url,
            'contact_email' => $this->contact_email,

            // Always a fully-qualified URL so the client can render it directly.
            'image_url' => $this->image_path
                ? Storage::disk('public')->url($this->image_path)
                : null,
            'original_image_name' => $this->original_image_name,
            'image_size' => $this->image_size,
            'mime_type' => $this->mime_type,

            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'images' => ProductImageResource::collection(
                $this->whenLoaded('images')
            ),

            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'deleted_by' => $this->deleted_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}
