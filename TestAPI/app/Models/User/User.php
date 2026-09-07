<?php

namespace App\Models\User;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Traits\HasAudit;
use App\Observers\AuditObserver;
use Database\Factories\User\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

#[Fillable([
    'first_name',
    'middle_name',
    'last_name',
    'username',
    'phone_number',
    'phone_verified_at',
    'email',
    'email_verified_at',
    'password',
    'user_status_id',
    'gender_id',
    'avatar_path',
    'original_avatar_name',
    'avatar_size',
    'avatar_mime_type',
    'date_of_birth',
    'bio',
    'address_line1',
    'address_line2',
    'city',
    'state',
    'postal_code',
    'country',
    'timezone',
    'locale',
    'last_login_at',
    'is_active',
])]
#[Hidden(['password', 'remember_token'])]
#[ObservedBy(AuditObserver::class)]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    // Aliased so the override below can extend the trait's list rather than
    // silently replacing it.
    use HasAudit {
        auditExclude as private traitAuditExclude;
    }

    /**
     * Columns the query-filter trait is allowed to act on.
     *
     * @var array<int, string>
     */
    public array $searchable = [
        'first_name',
        'last_name',
        'username',
        'email',
        'phone_number',
    ];

    /** @var array<int, string> */
    public array $filterable = [
        'is_active',
        'user_status_id',
        'gender_id',
        'city',
        'country',
    ];

    /** @var array<int, string> */
    public array $sortable = [
        'id',
        'first_name',
        'last_name',
        'username',
        'email',
        'is_active',
        'last_login_at',
        'created_at',
    ];

    /** @var array<int, string> */
    public array $includable = ['userStatus', 'gender', 'identityDetail', 'roles'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    // region Relation
    public function userStatus(): BelongsTo
    {
        return $this->belongsTo(UserStatus::class);
    }

    public function gender(): BelongsTo
    {
        return $this->belongsTo(Gender::class);
    }

    public function identityDetail(): HasOne
    {
        return $this->hasOne(IdentityDetail::class);
    }
    // endregion

    /**
     * Never log the password, and treat last_login_at as bookkeeping rather
     * than a change worth a row - otherwise every sign-in also emits an
     * "updated" event alongside its "login" event.
     *
     * @return array<int, string>
     */
    public function auditExclude(): array
    {
        return array_merge($this->traitAuditExclude(), ['last_login_at']);
    }

    /**
     * Prefer the person's name over the trait's generic name/#id fallback.
     */
    public function auditLabel(): string
    {
        return $this->full_name !== '' ? $this->full_name : (string) $this->email;
    }

    public function getFullNameAttribute(): string
    {
        return trim(
            implode(' ', array_filter([
                $this->first_name,
                $this->middle_name,
                $this->last_name,
            ]))
        );
    }
}
