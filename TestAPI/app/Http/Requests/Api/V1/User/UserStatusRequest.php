<?php

namespace App\Http\Requests\Api\V1\User;

use App\Http\Requests\BaseRequest;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

class UserStatusRequest extends BaseRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $statusId = $this->route('user_status') ? $this->route(
            'user_status'
        ) : null;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => $isUpdate ? [
                'sometimes',
                'string',
                Rule::unique('user_statuses', 'name')->ignore($statusId),
            ] : ['required', 'string', Rule::unique('user_statuses', 'name')],
            'description' => $isUpdate ? [
                'sometimes',
                'nullable',
                'string',
            ] : ['nullable', 'string'],
            'is_active' => $isUpdate
                ? ['sometimes', 'boolean']
                : [
                    'nullable',
                    'boolean',
                ],
        ];
    }
}
