<?php

namespace App\Observers;

use App\Services\Api\V1\Shared\AuditLogger;
use Illuminate\Database\Eloquent\Model;

/**
 * Writes an activity-log row for every lifecycle event on an audited model.
 *
 * Attached declaratively with #[ObservedBy(AuditObserver::class)] on the model,
 * so what is audited is visible at the top of the model rather than hidden in a
 * central registry.
 *
 * Observer callbacks run inside whatever transaction the caller opened, so a
 * rolled-back change takes its log row with it.
 */
class AuditObserver
{
    private AuditLogger $auditLogger;

    public function __construct(AuditLogger $auditLogger)
    {
        $this->auditLogger = $auditLogger;
    }

    public function created(Model $model): void
    {
        $this->auditLogger->log(
            event: 'created',
            subject: $model,
            newValues: $this->filter($model, $model->getAttributes()),
            description: $this->describe($model, 'created')
        );
    }

    public function updated(Model $model): void
    {
        $changes = $this->filter($model, $model->getChanges());

        // A save that changed nothing auditable (a touch, or a write of only
        // excluded columns) is not an event worth a row.
        if ($changes === []) {
            return;
        }

        $original = array_intersect_key($model->getRawOriginal(), $changes);

        $this->auditLogger->log(
            event: 'updated',
            subject: $model,
            oldValues: $original,
            newValues: $changes,
            description: $this->describe($model, 'updated')
        );
    }

    public function deleted(Model $model): void
    {
        // Deletes are always soft, so the full attribute set is preserved here
        // as well as in the row itself - the log stays readable even if the
        // record is later purged outside the app.
        $this->auditLogger->log(
            event: 'deleted',
            subject: $model,
            oldValues: $this->filter($model, $model->getAttributes()),
            description: $this->describe($model, 'deleted')
        );
    }

    public function restored(Model $model): void
    {
        $this->auditLogger->log(
            event: 'restored',
            subject: $model,
            description: $this->describe($model, 'restored')
        );
    }

    /**
     * Drop attributes the model marks as never-log (secrets, timestamps).
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function filter(Model $model, array $attributes): array
    {
        $excluded = method_exists($model, 'auditExclude')
            ? $model->auditExclude()
            : ['password', 'remember_token'];

        return array_diff_key($attributes, array_flip($excluded));
    }

    private function describe(Model $model, string $verb): string
    {
        $label = method_exists($model, 'auditLabel')
            ? $model->auditLabel()
            : '#'.$model->getKey();

        return class_basename($model).' "'.$label.'" was '.$verb;
    }
}
