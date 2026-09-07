<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\Tag;
use Illuminate\Pagination\LengthAwarePaginator;

interface TagRepositoryInterface
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Tag>
     */
    public function getAll(array $params = []): LengthAwarePaginator;

    public function getById(int $id): Tag;

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Tag;

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Tag $tag, array $data): bool;

    public function delete(Tag $tag): bool;

    public function restore(int $id): bool;
}
