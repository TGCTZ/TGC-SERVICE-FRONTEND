<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class BrandRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $id = $this->route('brand') ? $this->route('brand') : null;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => $isUpdate
                ? ['sometimes', 'string', 'max:255']
                : ['required', 'string', 'max:255'],
            'description' => $isUpdate
                ? ['sometimes', 'nullable', 'string']
                : ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'slug' => $isUpdate ? ['sometimes', 'string', 'max:255', Rule::unique('brands', 'slug')->ignore($id)] : ['nullable', 'string', 'max:255', Rule::unique('brands', 'slug')],
            'website_url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'country' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'brand name',
        ];
    }
}
