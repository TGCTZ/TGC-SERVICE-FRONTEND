<?php

namespace App\Services\Api\V1\User;

use App\Models\User\Gender;
use App\Repositories\Api\V1\User\GenderRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class GenderService
{
    private GenderRepositoryInterface $genderRepoInterface;

    public function __construct(
        GenderRepositoryInterface $genderRepoInterface
    ) {
        $this->genderRepoInterface = $genderRepoInterface;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Gender>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->genderRepoInterface->getAll($params);
    }

    public function getById(int $id): Gender
    {
        return $this->genderRepoInterface->getById($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Gender
    {
        return $this->genderRepoInterface->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Gender $gender, array $data): bool
    {
        return $this->genderRepoInterface->update($gender, $data);
    }

    public function delete(Gender $gender): bool
    {
        return $this->genderRepoInterface->delete($gender);
    }

    public function restore(int $id): bool
    {
        return $this->genderRepoInterface->restore($id);
    }
}
