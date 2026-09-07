<?php

namespace App\Http\Requests\Api\V1\User;

use App\Http\Requests\BaseRequest;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserRequest extends BaseRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('user') ? $this->route('user') : null;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'first_name' => $isUpdate
                ? ['sometimes', 'string', 'max:255']
                : ['required', 'string', 'max:255'],
            'middle_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'last_name' => $isUpdate
                ? ['sometimes', 'string', 'max:255']
                : ['required', 'string', 'max:255'],
            'username' => $isUpdate
                ? [
                    'sometimes',
                    'string',
                    Rule::unique('users', 'username')->ignore($userId),
                ]
                : [
                    'required',
                    'string',
                    Rule::unique('users', 'username')->ignore($userId),
                ],
            'email' => $isUpdate
                ? [
                    'sometimes',
                    'email',
                    Rule::unique('users', 'email')->ignore($userId),
                ]
                : [
                    'required',
                    'email',
                    Rule::unique('users', 'email')->ignore($userId),
                ],
            'phone_number' => $isUpdate
                ? ['sometimes', 'nullable', 'string', 'max:50']
                : ['required', 'string', 'max:50'],

            // On update an empty password means "leave unchanged".
            'password' => $isUpdate
                ? ['sometimes', 'nullable', 'confirmed', Password::min(8)]
                : ['required', 'confirmed', Password::min(8)],

            'user_status_id' => ['sometimes', 'nullable', 'integer', 'exists:user_statuses,id'],
            'gender_id' => ['sometimes', 'nullable', 'integer', 'exists:genders,id'],

            'date_of_birth' => ['sometimes', 'nullable', 'date', 'before:today'],
            'bio' => ['sometimes', 'nullable', 'string'],
            'address_line1' => ['sometimes', 'nullable', 'string', 'max:255'],
            'address_line2' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:255'],
            'state' => ['sometimes', 'nullable', 'string', 'max:255'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:50'],
            'country' => ['sometimes', 'nullable', 'string', 'max:255'],
            'timezone' => ['sometimes', 'nullable', 'string', 'max:255'],
            'locale' => ['sometimes', 'nullable', 'string', 'max:10'],
            'is_active' => ['sometimes', 'boolean'],

            // Real file upload — send as multipart/form-data.
            'avatar' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:2048',
            ],

            'roles' => ['sometimes', 'nullable', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'first_name' => 'first name',
            'middle_name' => 'middle name',
            'last_name' => 'last name',
            'phone_number' => 'phone number',
            'user_status_id' => 'user status',
            'gender_id' => 'gender',
            'date_of_birth' => 'date of birth',
            'address_line1' => 'address line 1',
            'address_line2' => 'address line 2',
            'postal_code' => 'postal code',
            'avatar' => 'avatar image',
        ];
    }
}
