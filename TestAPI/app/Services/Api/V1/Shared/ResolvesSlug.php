<?php

namespace App\Services\Api\V1\Shared;

use Illuminate\Support\Str;

/**
 * Derives a URL slug from a record's name when the client does not supply one.
 *
 * The slug columns are NOT NULL while every Request rule marks `slug` as
 * nullable on create, so without this a perfectly valid payload reaches the
 * database and fails with a 500. Deriving it here honours the contract the
 * validation rules advertise.
 */
trait ResolvesSlug
{
    /**
     * @param  array<string, mixed>  $data
     */
    protected function resolveSlug(array $data): string
    {
        if (! empty($data['slug'])) {
            return (string) $data['slug'];
        }

        // The random suffix keeps the unique index happy when two records
        // legitimately share a name.
        return Str::slug((string) ($data['name'] ?? '')).'-'
            .Str::lower(Str::random(6));
    }
}
