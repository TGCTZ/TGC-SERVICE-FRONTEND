<?php

namespace App\Models\User;

use App\Models\Traits\HasAudit;
use App\Observers\AuditObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy(AuditObserver::class)]
class IdentityDetail extends Model
{
    use HasAudit;
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'id_type',
        'id_number',
        'id_document_path',
        'expiry_date',
        'issue_date',
        'issue_country',
        'created_by',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
