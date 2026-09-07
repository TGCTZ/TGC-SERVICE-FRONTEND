<?php

namespace App\Http\Resources\Api\V1\Product;

use App\Http\Resources\BaseCollection;
use Illuminate\Http\Request;

class UnitOfMeasureCollection extends BaseCollection
{
    public $collects = UnitOfMeasureResource::class;

    /**
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'unit_of_measures' => $this->collection,
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
