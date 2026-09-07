<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * @mixin LengthAwarePaginator
 *
 * @method string|null url(int $page)
 * @method int lastPage()
 * @method string|null previousPageUrl()
 * @method string|null nextPageUrl()
 */
class BaseCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return parent::toArray($request);
    }

    /**
     * Suppress Laravel's own pagination block.
     *
     * Each collection builds its own `links` and `meta` inside toArray().
     * Left alone, Laravel would append a second, duplicate pagination block —
     * and because it has "additional information" to merge, it force-wraps the
     * payload in a `data` key even when wrapping is disabled globally.
     * Returning an empty array keeps the envelope flat:
     * `{ "<resources>": [...], "links": {...}, "meta": {...} }`.
     *
     * @param  array<string, mixed>  $paginated
     * @param  array<string, mixed>  $default
     * @return array<string, mixed>
     */
    public function paginationInformation(Request $request, array $paginated, array $default): array
    {
        return [];
    }
}
