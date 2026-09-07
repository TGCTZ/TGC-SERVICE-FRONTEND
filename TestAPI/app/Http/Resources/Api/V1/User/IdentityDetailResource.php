<?php

namespace App\Http\Resources\Api\V1\User;

use App\Http\Resources\BaseResource;
use App\Models\User\IdentityDetail;
use Illuminate\Http\Request;

/**
 * @mixin IdentityDetail
 */
class IdentityDetailResource extends BaseResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'id_type' => $this->id_type,
            'id_number' => $this->id_number,
            'id_document_path' => $this->id_document_path,
            'expiry_date' => $this->expiry_date,
            'issue_date' => $this->issue_date,
            'issue_country' => $this->issue_country,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'deleted_by' => $this->deleted_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}
