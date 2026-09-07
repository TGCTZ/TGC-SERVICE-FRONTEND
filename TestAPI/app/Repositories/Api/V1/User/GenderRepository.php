<?php

namespace App\Repositories\Api\V1\User;

use App\Models\User\Gender;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

class GenderRepository implements GenderRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Gender>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, Gender> $paginator */
        $paginator = $this->applyQueryParams(Gender::query(), $params);

        return $paginator;
    }

    #[Override]
    public function getById(int $id): Gender
    {
        return Gender::findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): Gender
    {
        return Gender::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function update(Gender $gender, array $data): bool
    {
        return $gender->update($data);
    }

    #[Override]
    public function delete(Gender $gender): bool
    {
        return $gender->delete();
    }

    #[Override]
    public function restore(int $id): bool
    {
        $gender = Gender::withTrashed()->findOrFail($id);

        return $gender->restore();
    }
}
