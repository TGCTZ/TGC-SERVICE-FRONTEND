<?php

namespace App\Services\Api\V1\User;

use App\Models\User\User;
use App\Repositories\Api\V1\User\UserRepositoryInterface;
use App\Services\Api\V1\Shared\AuditLogger;
use App\Services\Api\V1\Shared\FileUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UserService
{
    private UserRepositoryInterface $userRepoInterface;

    private FileUploadService $fileUploadService;

    private AuditLogger $auditLogger;

    public function __construct(
        UserRepositoryInterface $userRepoInterface,
        FileUploadService $fileUploadService,
        AuditLogger $auditLogger
    ) {
        $this->userRepoInterface = $userRepoInterface;
        $this->fileUploadService = $fileUploadService;
        $this->auditLogger = $auditLogger;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, User>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->userRepoInterface->getAll($params);
    }

    public function getById(int $id): User
    {
        return $this->userRepoInterface->getById($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): User
    {
        return DB::transaction(function () use ($data): User {
            $roles = $this->pull($data, 'roles');
            $avatar = $this->pull($data, 'avatar');

            if ($avatar instanceof UploadedFile) {
                $data = array_merge($data, $this->avatarColumns($avatar));
            }

            // The model casts `password` as hashed, so no manual Hash::make.
            $user = $this->userRepoInterface->create($data);

            if (is_array($roles)) {
                $this->userRepoInterface->syncRoles($user, $roles);
            }

            return $user->load(['userStatus', 'gender', 'roles']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data): bool
    {
        return DB::transaction(function () use ($user, $data): bool {
            $roles = $this->pull($data, 'roles');
            $avatar = $this->pull($data, 'avatar');

            if ($avatar instanceof UploadedFile) {
                $previousPath = $user->avatar_path;
                $data = array_merge($data, $this->avatarColumns($avatar));
                $this->fileUploadService->delete($previousPath);
            }

            // An empty password field means "leave it unchanged".
            if (empty($data['password'])) {
                unset($data['password']);
            }

            $updated = $this->userRepoInterface->update($user, $data);

            if (is_array($roles)) {
                $this->userRepoInterface->syncRoles($user, $roles);
            }

            return $updated;
        });
    }

    public function delete(User $user): bool
    {
        return $this->userRepoInterface->delete($user);
    }

    public function restore(int $id): bool
    {
        return $this->userRepoInterface->restore($id);
    }

    /**
     * @param  array<int, string>  $roles
     */
    public function syncRoles(User $user, array $roles): User
    {
        $before = $user->roles()->pluck('name')->sort()->values()->all();

        $updated = $this->userRepoInterface->syncRoles($user, $roles);

        $after = $updated->roles()->pluck('name')->sort()->values()->all();

        if ($before !== $after) {
            $this->auditLogger->log(
                event: 'roles_synced',
                subject: $user,
                oldValues: ['roles' => $before],
                newValues: ['roles' => $after],
                description: 'Roles updated for '.$user->auditLabel()
            );
        }

        return $updated;
    }

    /**
     * @return array<string, mixed>
     */
    private function avatarColumns(UploadedFile $avatar): array
    {
        $meta = $this->fileUploadService->store($avatar, 'avatars');

        return [
            'avatar_path' => $meta['path'],
            'original_avatar_name' => $meta['original_name'],
            'avatar_size' => $meta['size'],
            'avatar_mime_type' => $meta['mime_type'],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function pull(array &$data, string $key): mixed
    {
        $value = $data[$key] ?? null;
        unset($data[$key]);

        return $value;
    }
}
