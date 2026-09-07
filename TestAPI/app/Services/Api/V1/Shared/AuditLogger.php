<?php

namespace App\Services\Api\V1\Shared;

use App\Models\Audit\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;

/**
 * The single write path into the activity log.
 *
 * Everything that records history - the model observer, the auth service, the
 * RBAC sync endpoints - funnels through here so actor and request context are
 * captured identically no matter what triggered the event.
 *
 * Writes are synchronous on purpose. Queueing them would move the insert
 * outside the caller's DB::transaction, so a rolled-back change could still
 * leave a log row claiming it happened.
 */
class AuditLogger
{
    /** Shared by every row written during one request, so a cascade of related
     *  changes can be read back as a single action. */
    private static ?string $batchUuid = null;

    /** Seeders and data migrations write history that never happened. */
    private static bool $enabled = true;

    /**
     * Suspend auditing for bulk work such as seeding.
     */
    public static function disable(): void
    {
        self::$enabled = false;
    }

    public static function enable(): void
    {
        self::$enabled = true;
    }

    /**
     * Record an event.
     *
     * @param  string  $event  created|updated|deleted|restored|login|logout|
     *                         login_failed|permissions_synced|roles_synced
     * @param  Model|null  $subject  The record acted on; null for auth events.
     * @param  array<string, mixed>|null  $oldValues  Changed attributes, before.
     * @param  array<string, mixed>|null  $newValues  Changed attributes, after.
     */
    public function log(
        string $event,
        ?Model $subject = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null,
        ?int $causerId = null,
        ?string $causerLabel = null
    ): void {
        if (! self::$enabled) {
            return;
        }

        try {
            $causer = Auth::user();

            ActivityLog::create([
                'event' => $event,
                'description' => $description,
                'subject_type' => $subject !== null ? $subject::class : null,
                'subject_id' => $subject?->getKey(),
                'subject_label' => $this->labelFor($subject),
                'causer_id' => $causerId ?? $causer?->getKey(),
                'causer_label' => $causerLabel ?? $this->labelFor($causer),
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => Request::ip(),
                'user_agent' => Str::limit((string) Request::userAgent(), 1000, ''),
                'method' => Request::method(),
                'url' => Str::limit(Request::fullUrl(), 2000, ''),
                'batch_uuid' => self::batchUuid(),
            ]);
        } catch (\Throwable $e) {
            // Auditing must never break the operation it is describing. A
            // failed log line is a monitoring problem, not a user-facing 500.
            Log::error('Failed to write activity log: '.$e->getMessage(), [
                'event' => $event,
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
        }
    }

    /**
     * Snapshot a model's display name, tolerating models without auditLabel().
     */
    private function labelFor(?Model $model): ?string
    {
        if ($model === null) {
            return null;
        }

        if (method_exists($model, 'auditLabel')) {
            return $model->auditLabel();
        }

        $name = $model->getAttribute('full_name') ?? $model->getAttribute('name');

        return is_string($name) && $name !== '' ? $name : '#'.$model->getKey();
    }

    private static function batchUuid(): string
    {
        return self::$batchUuid ??= (string) Str::uuid();
    }
}
