<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class ProductCategoryRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $id = $this->route('product_category') ? $this->route('product_category') : null;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => $isUpdate
                ? ['sometimes', 'string', 'max:255']
                : ['required', 'string', 'max:255'],
            'description' => $isUpdate
                ? ['sometimes', 'nullable', 'string']
                : ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'slug' => $isUpdate ? ['sometimes', 'string', 'max:255', Rule::unique('product_categories', 'slug')->ignore($id)] : ['nullable', 'string', 'max:255', Rule::unique('product_categories', 'slug')],
            'parent_id' => ['sometimes', 'nullable', 'integer', 'exists:product_categories,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'category name',
        ];
    }
}
