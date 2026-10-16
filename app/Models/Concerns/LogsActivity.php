<?php

namespace App\Models\Concerns;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

/**
 * Writes an audit trail row for every create/update/delete on the model:
 * who did it and which attributes changed (old → new). Secrets and
 * bookkeeping timestamps are never recorded.
 */
trait LogsActivity
{
    public static function bootLogsActivity(): void
    {
        static::created(function (Model $model) {
            $model->writeActivity('created', ['attributes' => $model->loggableAttributes($model->getAttributes())]);
        });

        static::updated(function (Model $model) {
            $changes = $model->loggableAttributes($model->getChanges());
            if (! $changes) {
                return;
            }

            $old = [];
            foreach (array_keys($changes) as $key) {
                $old[$key] = $model->getRawOriginal($key);
            }

            $model->writeActivity('updated', ['old' => $old, 'attributes' => $changes]);
        });

        static::deleted(function (Model $model) {
            $model->writeActivity('deleted', ['old' => $model->loggableAttributes($model->getAttributes())]);
        });
    }

    protected function loggableAttributes(array $attributes): array
    {
        return Arr::except($attributes, [
            'password', 'remember_token', 'created_at', 'updated_at',
        ]);
    }

    protected function writeActivity(string $event, array $properties): void
    {
        ActivityLog::create([
            'event' => $event,
            'subject_type' => $this->getMorphClass(),
            'subject_id' => $this->getKey(),
            'causer_id' => auth()->id(),
            'properties' => $properties,
        ]);
    }
}
