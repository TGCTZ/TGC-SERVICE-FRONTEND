<?php

namespace App\Http\Resources\Api\V1\Audit;

use App\Http\Resources\BaseResource;
use App\Models\Audit\ActivityLog;
use Illuminate\Http\Request;

/**
 * @mixin ActivityLog
 */
class ActivityLogResource extends BaseResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event' => $this->event,
            'description' => $this->description,

            'subject_type' => $this->subject_type,
            // The bare class name is what the UI shows and filters on; the
            // fully-qualified name stays available above for exact matching.
            'subject_name' => $this->subject_type !== null
                ? class_basename($this->subject_type)
                : null,
            'subject_id' => $this->subject_id,
            'subject_label' => $this->subject_label,

            'causer_id' => $this->causer_id,
            'causer_label' => $this->causer_label,
            'causer' => $this->whenLoaded('causer', fn () => [
                'id' => $this->causer->id,
                'full_name' => $this->causer->full_name,
                'email' => $this->causer->email,
                'avatar_url' => $this->causer->avatar_path !== null
                    ? asset('storage/'.$this->causer->avatar_path)
                    : null,
            ]),

            'old_values' => $this->old_values,
            'new_values' => $this->new_values,

            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'method' => $this->method,
            'url' => $this->url,
            'batch_uuid' => $this->batch_uuid,

            'created_at' => $this->created_at,
        ];
    }
}
