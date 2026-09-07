<?php

namespace App\Http\Requests\Api\V1\User;

use App\Http\Requests\BaseRequest;
use Illuminate\Contracts\Validation\ValidationRule;

class IdentityDetailRequest extends BaseRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $identityId = $this->route('identity_detail') ? $this->route(
            'identity_detail'
        ) : null;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'user_id' => $isUpdate ? [
                'sometimes',
                'integer',
                'exists:users,id',
            ] : ['required', 'integer', 'exists:users,id'],
            'id_type' => $isUpdate
                ? ['sometimes', 'string']
                : [
                    'required',
                    'string',
                ],
            'id_number' => $isUpdate
                ? ['sometimes', 'string']
                : [
                    'required',
                    'string',
                ],
            'id_document_path' => $isUpdate ? [
                'sometimes',
                'string',
            ] : ['nullable', 'string'],
            'expiry_date' => $isUpdate
                ? ['sometimes', 'date']
                : [
                    'nullable',
                    'date',
                ],
            'issue_date' => $isUpdate
                ? ['sometimes', 'date']
                : [
                    'nullable',
                    'date',
                ],
            'issue_country' => $isUpdate ? [
                'sometimes',
                'string',
            ] : ['nullable', 'string'],
        ];
    }
}
