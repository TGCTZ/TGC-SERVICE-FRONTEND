<?php

namespace App\Http\Resources\Api\V1\System;

use App\Http\Resources\BaseCollection;
use Illuminate\Http\Request;

/**
 * Mirrors the envelope of every other list endpoint, so the frontend's shared
 * pagination schema works here despite there being no model behind it.
 */
class SystemLogCollection extends BaseCollection
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'system_logs' => $this->collection,
            'links' => [
                'first_page' => $this->url(1),
                'last_page' => $this->url($this->lastPage()),
                'previous_page' => $this->previousPageUrl(),
                'next_page' => $this->nextPageUrl(),
            ],
            'meta' => [
                'current_page' => $this->currentPage(),
                'last_page' => $this->lastPage(),
                'per_page' => $this->perPage(),
                'total' => $this->total(),
            ],
        ];
    }
}
