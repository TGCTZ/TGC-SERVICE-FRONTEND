<?php

namespace App\Http\Requests\Api\V2\User;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class UserStoreRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string'],
            'last_name' => ['required', 'string'],
            'username' => [
                'required',
                'string',
                Rule::unique('users', 'username'),
            ],
            'email' => ['required', 'email', Rule::unique('users', 'email')],
            'phone_number' => ['required', 'string'],
            'password' => ['required', 'confirmed'],
        ];
    }
}
