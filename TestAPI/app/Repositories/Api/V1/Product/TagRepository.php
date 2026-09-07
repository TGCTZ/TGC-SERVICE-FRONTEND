<?php

namespace App\Repositories\Api\V1\Product;

use App\Models\Product\Tag;
use App\Repositories\Traits\HasQueryFilters;
use Illuminate\Pagination\LengthAwarePaginator;
use Override;

class TagRepository implements TagRepositoryInterface
{
    use HasQueryFilters;

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Tag>
     */
    #[Override]
    public function getAll(array $params = []): LengthAwarePaginator
    {
        /** @var LengthAwarePaginator<int, Tag> $paginator */
        $paginator = $this->applyQueryParams(Tag::query(), $params);

        return $paginator;
    }

    #[Override]
    public function getById(int $id): Tag
    {
        return Tag::findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function create(array $data): Tag
    {
        return Tag::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    #[Override]
    public function update(Tag $tag, array $data): bool
    {
        return $tag->update($data);
    }

    #[Override]
    public function delete(Tag $tag): bool
    {
        return $tag->delete();
    }

    #[Override]
    public function restore(int $id): bool
    {
        $tag = Tag::withTrashed()->findOrFail($id);

        return $tag->restore();
    }
}
