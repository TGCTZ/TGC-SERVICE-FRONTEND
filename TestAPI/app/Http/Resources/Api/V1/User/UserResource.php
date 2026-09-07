<?php

namespace App\Http\Resources\Api\V1\User;

use App\Http\Resources\BaseResource;
use App\Models\User\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin User
 */
class UserResource extends BaseResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'username' => $this->username,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'phone_number' => $this->phone_number,
            'phone_verified_at' => $this->phone_verified_at,

            'avatar_url' => $this->avatar_path
                ? Storage::disk('public')->url($this->avatar_path)
                : null,
            'original_avatar_name' => $this->original_avatar_name,
            'avatar_size' => $this->avatar_size,
            'avatar_mime_type' => $this->avatar_mime_type,

            'date_of_birth' => $this->date_of_birth,
            'bio' => $this->bio,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'timezone' => $this->timezone,
            'locale' => $this->locale,
            'last_login_at' => $this->last_login_at,
            'is_active' => $this->is_active,

            'user_status_id' => $this->user_status_id,
            'user_status' => new UserStatusResource($this->whenLoaded('userStatus')),
            'gender_id' => $this->gender_id,
            'gender' => new GenderResource($this->whenLoaded('gender')),

            // Visible to the user themselves and to anyone who may view users,
            // so the admin RBAC screens can show and edit assignments.
            'roles' => $this->when(
                $this->canSeeAccess($request),
                fn () => $this->getRoleNames()
            ),
            'permissions' => $this->when(
                $this->canSeeAccess($request),
                fn () => $this->getAllPermissions()->pluck('name')
            ),

            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'deleted_by' => $this->deleted_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
        ];
    }

    /** Whether the requester may see this user's roles and permissions. */
    private function canSeeAccess(Request $request): bool
    {
        $requester = $request->user();

        if (! $requester instanceof User) {
            return false;
        }

        return $requester->is($this->resource) || $requester->can('users.view');
    }
}
