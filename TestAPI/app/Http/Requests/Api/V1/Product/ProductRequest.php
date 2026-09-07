<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $id = $this->route('product') ? $this->route('product') : null;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => $isUpdate
                ? ['sometimes', 'string', 'max:255']
                : ['required', 'string', 'max:255'],
            'slug' => $isUpdate ? [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($id),
            ] : ['nullable', 'string', 'max:255', Rule::unique('products', 'slug')],
            'sku' => $isUpdate ? [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('products', 'sku')->ignore($id),
            ] : ['required', 'string', 'max:255', Rule::unique('products', 'sku')],
            'barcode' => $isUpdate
                ? ['sometimes', 'nullable', 'string', 'max:255']
                : ['nullable', 'string', 'max:255'],

            'short_description' => $isUpdate
                ? ['sometimes', 'nullable', 'string', 'max:255']
                : ['nullable', 'string', 'max:255'],
            'description' => $isUpdate
                ? ['sometimes', 'nullable', 'string']
                : ['nullable', 'string'],

            'product_category_id' => $isUpdate
                ? ['sometimes', 'integer', 'exists:product_categories,id']
                : ['required', 'integer', 'exists:product_categories,id'],
            'brand_id' => $isUpdate
                ? ['sometimes', 'nullable', 'integer', 'exists:brands,id']
                : ['nullable', 'integer', 'exists:brands,id'],
            'product_status_id' => $isUpdate
                ? ['sometimes', 'integer', 'exists:product_statuses,id']
                : ['required', 'integer', 'exists:product_statuses,id'],
            'unit_of_measure_id' => $isUpdate
                ? ['sometimes', 'nullable', 'integer', 'exists:unit_of_measures,id']
                : ['nullable', 'integer', 'exists:unit_of_measures,id'],

            'price' => $isUpdate
                ? ['sometimes', 'numeric', 'min:0']
                : ['required', 'numeric', 'min:0'],
            'cost_price' => $isUpdate
                ? ['sometimes', 'nullable', 'numeric', 'min:0']
                : ['nullable', 'numeric', 'min:0'],
            'discount_percentage' => $isUpdate
                ? ['sometimes', 'nullable', 'numeric', 'between:0,100']
                : ['nullable', 'numeric', 'between:0,100'],
            'tax_rate' => $isUpdate
                ? ['sometimes', 'nullable', 'numeric', 'between:0,100']
                : ['nullable', 'numeric', 'between:0,100'],
            'currency' => $isUpdate
                ? ['sometimes', 'string', 'size:3']
                : ['nullable', 'string', 'size:3'],

            'stock_quantity' => $isUpdate
                ? ['sometimes', 'integer', 'min:0']
                : ['nullable', 'integer', 'min:0'],
            'reorder_level' => $isUpdate
                ? ['sometimes', 'nullable', 'integer', 'min:0']
                : ['nullable', 'integer', 'min:0'],
            'weight' => $isUpdate
                ? ['sometimes', 'nullable', 'numeric', 'min:0']
                : ['nullable', 'numeric', 'min:0'],
            'length' => $isUpdate
                ? ['sometimes', 'nullable', 'numeric', 'min:0']
                : ['nullable', 'numeric', 'min:0'],
            'width' => $isUpdate
                ? ['sometimes', 'nullable', 'numeric', 'min:0']
                : ['nullable', 'numeric', 'min:0'],
            'height' => $isUpdate
                ? ['sometimes', 'nullable', 'numeric', 'min:0']
                : ['nullable', 'numeric', 'min:0'],
            'warranty_months' => $isUpdate
                ? ['sometimes', 'nullable', 'integer', 'min:0']
                : ['nullable', 'integer', 'min:0'],
            'rating' => $isUpdate
                ? ['sometimes', 'nullable', 'numeric', 'between:0,5']
                : ['nullable', 'numeric', 'between:0,5'],

            'is_active' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_digital' => ['sometimes', 'boolean'],
            'requires_shipping' => ['sometimes', 'boolean'],

            'released_at' => $isUpdate
                ? ['sometimes', 'nullable', 'date']
                : ['nullable', 'date'],
            'available_from' => $isUpdate
                ? ['sometimes', 'nullable', 'date']
                : ['nullable', 'date'],
            'expiry_date' => $isUpdate
                ? ['sometimes', 'nullable', 'date', 'after_or_equal:released_at']
                : ['nullable', 'date', 'after_or_equal:released_at'],

            'specifications' => ['sometimes', 'nullable', 'array'],
            'metadata' => ['sometimes', 'nullable', 'array'],

            'color' => $isUpdate
                ? ['sometimes', 'nullable', 'string', 'max:50']
                : ['nullable', 'string', 'max:50'],
            'website_url' => $isUpdate
                ? ['sometimes', 'nullable', 'url', 'max:255']
                : ['nullable', 'url', 'max:255'],
            'contact_email' => $isUpdate
                ? ['sometimes', 'nullable', 'email', 'max:255']
                : ['nullable', 'email', 'max:255'],

            // Real file upload — send as multipart/form-data.
            'image' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:2048',
            ],

            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['integer', 'exists:tags,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'product name',
            'sku' => 'SKU',
            'product_category_id' => 'category',
            'brand_id' => 'brand',
            'product_status_id' => 'status',
            'unit_of_measure_id' => 'unit of measure',
            'price' => 'price',
            'cost_price' => 'cost price',
            'discount_percentage' => 'discount percentage',
            'tax_rate' => 'tax rate',
            'stock_quantity' => 'stock quantity',
            'reorder_level' => 'reorder level',
            'warranty_months' => 'warranty (months)',
            'released_at' => 'release date',
            'available_from' => 'available from',
            'expiry_date' => 'expiry date',
            'website_url' => 'website URL',
            'contact_email' => 'contact email',
            'image' => 'product image',
        ];
    }
}
