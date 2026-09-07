<?php

namespace App\Http\Resources\Api\V2\User;

use App\Http\Resources\BaseCollection;
use Illuminate\Http\Request;

class UserCollection extends BaseCollection
{
    public $collects = UserResource::class;

    /**
     * @return array<int|string, mixed>
     */
    public function toArray(Request $request): array
    {
        return parent::toArray($request);
    }
}
