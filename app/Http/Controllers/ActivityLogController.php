<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Super Admin: read-only audit trail written by the LogsActivity trait. */
class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $subject = $request->query('subject');

        $logs = ActivityLog::with('causer:id,name,role')
            ->when($subject, fn ($q) => $q->where('subject_type', $subject))
            ->latest()
            ->latest('id')
            ->paginate(30)
            ->withQueryString();

        $logs->getCollection()->transform(function (ActivityLog $log) {
            $log->setAttribute('subject_label', class_basename($log->subject_type ?? '')." #{$log->subject_id}");

            return $log;
        });

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $logs,
            'subjects' => ActivityLog::distinct()->orderBy('subject_type')->pluck('subject_type')
                ->map(fn ($type) => ['value' => $type, 'label' => class_basename($type)]),
            'filters' => ['subject' => $subject],
        ]);
    }
}
