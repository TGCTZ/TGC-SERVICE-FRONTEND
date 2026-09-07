<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class TagRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $id = $this->route('tag') ? $this->route('tag') : null;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => $isUpdate
                ? ['sometimes', 'string', 'max:255']
                : ['required', 'string', 'max:255'],
            'description' => $isUpdate
                ? ['sometimes', 'nullable', 'string']
                : ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'slug' => $isUpdate ? ['sometimes', 'string', 'max:255', Rule::unique('tags', 'slug')->ignore($id)] : ['nullable', 'string', 'max:255', Rule::unique('tags', 'slug')],
            'color' => ['sometimes', 'nullable', 'string', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'tag name',
        ];
    }
}
