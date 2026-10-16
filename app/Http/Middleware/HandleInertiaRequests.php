<?php

namespace App\Http\Middleware;

use App\Services\RoleAccess;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role?->value,
                    'role_label' => $user->role?->label(),
                    'phone' => $user->phone,
                    'prefers_sms' => $user->prefers_sms,
                    'barangay_id' => $user->barangay_id,
                    'purok_id' => $user->purok_id,
                    'status' => $user->status,
                    // Access Control: modules the role can open (sidebar) and the level
                    // per module (full | view | none) so pages hide actions for View Only.
                    'modules' => app(RoleAccess::class)->modulesFor($user->role),
                    'access' => app(RoleAccess::class)->levelsFor($user->role),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notifications' => fn () => $user
                ? $user->unreadNotifications()->latest()->limit(20)->get()->map(fn ($n) => [
                    'id' => $n->id,
                    'message' => $n->data['message'] ?? 'Notification',
                    'report_id' => $n->data['report_id'] ?? null,
                    'url' => $n->data['url'] ?? null,
                    'created_at' => $n->created_at?->toIso8601String(),
                ])
                : [],
        ];
    }
}
