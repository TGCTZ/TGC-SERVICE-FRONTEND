<?php

namespace App\Http\Resources\Api\V1\User;

use App\Http\Resources\BaseResource;
use App\Models\User\Permission;
use Illuminate\Http\Request;

/**
 * @mixin Permission
 */
class PermissionResource extends BaseResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'guard_name' => $this->guard_name,
            // Resource segment ("products.create" → "products"), so the UI can
            // group the permission matrix without parsing names itself.
            'group' => $this->resourceGroup(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
