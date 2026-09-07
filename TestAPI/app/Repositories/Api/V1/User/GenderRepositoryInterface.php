<?php

namespace App\Repositories\Api\V1\User;

use App\Models\User\Gender;
use Illuminate\Pagination\LengthAwarePaginator;

interface GenderRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Gender>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): Gender;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Gender;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Gender $gender, array $data): bool;

    public function delete(Gender $gender): bool;

    public function restore(int $id): bool;
}
