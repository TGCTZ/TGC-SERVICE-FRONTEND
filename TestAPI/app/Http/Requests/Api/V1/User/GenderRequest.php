<?php

namespace App\Http\Requests\Api\V1\User;

use App\Http\Requests\BaseRequest;

class GenderRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $id = $this->route('gender') ? $this->route('gender') : null;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => $isUpdate
                ? ['sometimes', 'string', 'max:255']
                : ['required', 'string', 'max:255'],
            'description' => $isUpdate
                ? ['sometimes', 'nullable', 'string']
                : ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'gender name',
        ];
    }
}
