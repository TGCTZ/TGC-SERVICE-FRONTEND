<?php

namespace App\Http\Requests\Api\V1\Product;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class UnitOfMeasureRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $id = $this->route('unit_of_measure') ? $this->route('unit_of_measure') : null;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => $isUpdate
                ? ['sometimes', 'string', 'max:255']
                : ['required', 'string', 'max:255'],
            'description' => $isUpdate
                ? ['sometimes', 'nullable', 'string']
                : ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'code' => $isUpdate ? ['sometimes', 'string', 'max:50', Rule::unique('unit_of_measures', 'code')->ignore($id)] : ['required', 'string', 'max:50', Rule::unique('unit_of_measures', 'code')],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'unit of measure name',
        ];
    }
}
