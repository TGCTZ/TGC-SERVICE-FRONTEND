<?php

namespace App\Repositories\Api\V1\Audit;

use App\Models\Audit\ActivityLog;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

class ActivityLogRepository implements ActivityLogRepositoryInterface
{
    use HasQueryFilters;

    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, ActivityLog> $paginator */
        $paginator = $this->applyQueryParams(
            ActivityLog::query()->with('causer')->latest('created_at'),
            $params
        );

        return $paginator;
    }

    #[Override]
    public function getById(int $id): ActivityLog
    {
        return ActivityLog::with('causer')->findOrFail($id);
    }
}
