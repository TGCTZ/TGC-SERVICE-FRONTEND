<?php

namespace App\Services\Api\V1\Product;

use App\Models\Product\Tag;
use App\Repositories\Api\V1\Product\TagRepositoryInterface;
use App\Services\Api\V1\Shared\ResolvesSlug;
use Illuminate\Pagination\LengthAwarePaginator;

class TagService
{
    use ResolvesSlug;

    private TagRepositoryInterface $tagRepoInterface;

    public function __construct(
        TagRepositoryInterface $tagRepoInterface
    ) {
        $this->tagRepoInterface = $tagRepoInterface;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, Tag>
     */
    public function getAll(array $params = []): LengthAwarePaginator
    {
        return $this->tagRepoInterface->getAll($params);
    }

    public function getById(int $id): Tag
    {
        return $this->tagRepoInterface->getById($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Tag
    {
        $data['slug'] = $this->resolveSlug($data);

        return $this->tagRepoInterface->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Tag $tag, array $data): bool
    {
        return $this->tagRepoInterface->update($tag, $data);
    }

    public function delete(Tag $tag): bool
    {
        return $this->tagRepoInterface->delete($tag);
    }

    public function restore(int $id): bool
    {
        return $this->tagRepoInterface->restore($id);
    }
}
