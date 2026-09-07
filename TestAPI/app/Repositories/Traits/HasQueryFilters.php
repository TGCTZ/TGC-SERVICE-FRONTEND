<?php

namespace App\Repositories\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Applies request query parameters (search, filter, sort, trashed, includes)
 * to an Eloquent builder and paginates the result.
 *
 * Every whitelist is read from the model itself ($searchable, $filterable,
 * $sortable, $includable) so a client can never sort or filter by an arbitrary
 * column, which would leak schema details and invite SQL abuse.
 *
 * Supported params:
 *   page, per_page (1-100, default 15), search, sort_by, sort_dir,
 *   filter[field]=value|csv, filter[field][from]/[to] (dates),
 *   with_trashed, only_trashed, include=csv
 */
trait HasQueryFilters
{
    /**
     * @param  array<string, mixed>  $params
     * @return LengthAwarePaginator<int, covariant \Illuminate\Database\Eloquent\Model>
     */
    protected function applyQueryParams(
        Builder $query,
        array $params
    ): LengthAwarePaginator {
        $model = $query->getModel();

        $searchable = property_exists($model, 'searchable') ? $model->searchable : [];
        $filterable = property_exists($model, 'filterable') ? $model->filterable : [];
        $sortable = property_exists($model, 'sortable') ? $model->sortable : [];
        $includable = property_exists($model, 'includable') ? $model->includable : [];
        $dateFilterable = property_exists($model, 'dateFilterable') ? $model->dateFilterable : [];

        $this->applyTrashed($query, $params);
        $this->applyIncludes($query, $params, $includable);
        $this->applySearch($query, $params, $searchable);
        $this->applyFilters($query, $params, $filterable);
        $this->applyDateRanges($query, $params, $dateFilterable);
        $this->applySorting($query, $params, $sortable);

        $perPage = (int) ($params['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $params
     */
    private function applyTrashed(Builder $query, array $params): void
    {
        if ($this->isTruthy($params['only_trashed'] ?? false)) {
            $query->onlyTrashed();

            return;
        }

        if ($this->isTruthy($params['with_trashed'] ?? false)) {
            $query->withTrashed();
        }
    }

    /**
     * @param  array<string, mixed>  $params
     * @param  array<int, string>  $includable
     */
    private function applyIncludes(
        Builder $query,
        array $params,
        array $includable
    ): void {
        $includes = array_intersect(
            $this->toArray($params['include'] ?? []),
            $includable
        );

        if ($includes !== []) {
            $query->with($includes);
        }
    }

    /**
     * @param  array<string, mixed>  $params
     * @param  array<int, string>  $searchable
     */
    private function applySearch(
        Builder $query,
        array $params,
        array $searchable
    ): void {
        $search = trim((string) ($params['search'] ?? ''));

        if ($search === '' || $searchable === []) {
            return;
        }

        // Postgres needs ILIKE for case-insensitive matching; SQLite (used by
        // the test suite) only knows LIKE, which is already case-insensitive.
        $operator = $query->getConnection()->getDriverName() === 'pgsql'
            ? 'ilike'
            : 'like';

        $query->where(
            function (Builder $builder) use ($search, $searchable, $operator): void {
                foreach ($searchable as $column) {
                    $builder->orWhere($column, $operator, '%'.$search.'%');
                }
            }
        );
    }

    /**
     * @param  array<string, mixed>  $params
     * @param  array<int, string>  $filterable
     */
    private function applyFilters(
        Builder $query,
        array $params,
        array $filterable
    ): void {
        /** @var array<string, mixed> $filters */
        $filters = (array) ($params['filter'] ?? []);

        foreach ($filters as $field => $value) {
            if (! in_array($field, $filterable, true)) {
                continue;
            }

            if ($value === null || $value === '' || $value === []) {
                continue;
            }

            // A from/to pair is a range, handled by applyDateRanges.
            if (is_array($value) && (isset($value['from']) || isset($value['to']))) {
                continue;
            }

            $values = $this->toArray($value);

            count($values) > 1
                ? $query->whereIn($field, $values)
                : $query->where($field, reset($values));
        }
    }

    /**
     * Apply `filter[column][from]` / `filter[column][to]` date bounds.
     *
     * Equality filters cannot express "everything since Monday", which is the
     * question almost every date column is actually asked. Bounds are
     * inclusive on both ends and each side is optional.
     *
     * @param  array<string, mixed>  $params
     * @param  array<int, string>  $dateFilterable
     */
    private function applyDateRanges(
        Builder $query,
        array $params,
        array $dateFilterable
    ): void {
        /** @var array<string, mixed> $filters */
        $filters = (array) ($params['filter'] ?? []);

        foreach ($filters as $field => $value) {
            if (! in_array($field, $dateFilterable, true) || ! is_array($value)) {
                continue;
            }

            $from = trim((string) ($value['from'] ?? ''));
            $to = trim((string) ($value['to'] ?? ''));

            if ($from !== '') {
                $query->whereDate($field, '>=', $from);
            }

            if ($to !== '') {
                $query->whereDate($field, '<=', $to);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $params
     * @param  array<int, string>  $sortable
     */
    private function applySorting(
        Builder $query,
        array $params,
        array $sortable
    ): void {
        $sortBy = $params['sort_by'] ?? null;

        $sortDir = strtolower((string) ($params['sort_dir'] ?? 'asc')) === 'desc'
            ? 'desc'
            : 'asc';

        if (is_string($sortBy) && in_array($sortBy, $sortable, true)) {
            $query->orderBy($sortBy, $sortDir);

            return;
        }

        $query->orderByDesc($query->getModel()->getKeyName());
    }

    /**
     * Normalise a param that may arrive as an array or a comma-separated string.
     *
     * @return array<int, string>
     */
    private function toArray(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map('strval', $value), 'strlen'));
        }

        return array_values(
            array_filter(array_map('trim', explode(',', (string) $value)), 'strlen')
        );
    }

    private function isTruthy(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOL);
    }
}
