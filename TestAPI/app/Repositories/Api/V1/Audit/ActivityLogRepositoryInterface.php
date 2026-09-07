<?php

namespace App\Repositories\Api\V1\Audit;

use App\Models\Audit\ActivityLog;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Read-only: the activity log is append-only and is written solely by
 * App\Services\Api\V1\Shared\AuditLogger.
 */
interface ActivityLogRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, ActivityLog>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): ActivityLog;
}
