<?php

namespace App\Services\Api\V1\Audit;

use App\Models\Audit\ActivityLog;
use App\Repositories\Api\V1\Audit\ActivityLogRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class ActivityLogService
{
    private ActivityLogRepositoryInterface $activityLogRepoInterface;

    public function __construct(
        ActivityLogRepositoryInterface $activityLogRepoInterface
    ) {
        $this->activityLogRepoInterface = $activityLogRepoInterface;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, ActivityLog>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->activityLogRepoInterface->getAll($params);
    }

    public function getById(int $id): ActivityLog
    {
        return $this->activityLogRepoInterface->getById($id);
    }
}
