<?php

namespace App\Services\Api\V1\User;

use App\Models\User\Role;
use App\Repositories\Api\V1\User\RoleRepositoryInterface;
use App\Services\Api\V1\Shared\AuditLogger;
use Illuminate\Pagination\LengthAwarePaginator;
use RuntimeException;

class RoleService
{
    private RoleRepositoryInterface $roleRepoInterface;

    private AuditLogger $auditLogger;

    public function __construct(
        RoleRepositoryInterface $roleRepoInterface,
        AuditLogger $auditLogger
    ) {
        $this->roleRepoInterface = $roleRepoInterface;
        $this->auditLogger = $auditLogger;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Role>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->roleRepoInterface->getAll($params);
    }

    public function getById(int $id): Role
    {
        return $this->roleRepoInterface->getById($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Role
    {
        $permissions = $data['permissions'] ?? null;
        unset($data['permissions']);

        $data['guard_name'] = $data['guard_name'] ?? 'web';

        $role = $this->roleRepoInterface->create($data);

        if (is_array($permissions)) {
            $this->roleRepoInterface->syncPermissions($role, $permissions);
        }

        return $role->load('permissions');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Role $role, array $data): bool
    {
        $this->guardProtected($role);

        $permissions = $data['permissions'] ?? null;
        unset($data['permissions']);

        $updated = $this->roleRepoInterface->update($role, $data);

        if (is_array($permissions)) {
            $this->roleRepoInterface->syncPermissions($role, $permissions);
        }

        return $updated;
    }

    public function delete(Role $role): bool
    {
        $this->guardProtected($role);

        return $this->roleRepoInterface->delete($role);
    }

    /**
     * @param  array<int, string>  $permissions
     */
    public function syncPermissions(Role $role, array $permissions): Role
    {
        $this->guardProtected($role);

        // Snapshot before the sync: a grant of privilege is the single most
        // security-relevant event this API can record, and the diff is only
        // recoverable if the old set is captured first. Role is a spatie model
        // outside the AuditObserver, so this is logged explicitly.
        $before = $role->permissions()->pluck('name')->sort()->values()->all();

        $updated = $this->roleRepoInterface->syncPermissions($role, $permissions);

        $after = $updated->permissions()->pluck('name')->sort()->values()->all();

        if ($before !== $after) {
            $this->auditLogger->log(
                event: 'permissions_synced',
                subject: $role,
                oldValues: ['permissions' => $before],
                newValues: ['permissions' => $after],
                description: 'Permissions updated for role "'.$role->name.'"'
            );
        }

        return $updated;
    }

    /**
     * Superadmin must keep every permission, otherwise an administrator can
     * lock everyone (including themselves) out of the RBAC screens.
     */
    private function guardProtected(Role $role): void
    {
        if ($role->isProtected()) {
            throw new RuntimeException(
                'The '.$role->name.' role is protected and cannot be modified.'
            );
        }
    }
}
