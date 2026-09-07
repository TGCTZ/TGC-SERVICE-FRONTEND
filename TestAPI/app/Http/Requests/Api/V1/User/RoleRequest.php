<?php

namespace App\Http\Requests\Api\V1\User;

use App\Http\Requests\BaseRequest;
use Illuminate\Validation\Rule;

class RoleRequest extends BaseRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $id = $this->route('role') ? $this->route('role') : null;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'name' => $isUpdate ? [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->ignore($id),
            ] : ['required', 'string', 'max:255', Rule::unique('roles', 'name')],
            'guard_name' => ['sometimes', 'string', 'max:255'],

            // Permission names, not ids — spatie syncs by name and the UI
            // matrix is keyed by name too.
            'permissions' => ['sometimes', 'nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'role name',
            'guard_name' => 'guard name',
            'permissions' => 'permissions',
        ];
    }
}
