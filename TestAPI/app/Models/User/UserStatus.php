<?php

namespace App\Models\User;

use App\Models\Traits\HasAudit;
use App\Observers\AuditObserver;
use Database\Factories\User\UserStatusFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy(AuditObserver::class)]
class UserStatus extends Model
{
    use HasAudit;

    /** @use HasFactory<UserStatusFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
