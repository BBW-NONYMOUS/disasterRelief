<?php

namespace App\Http\Middleware;

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
                    'barangay_id' => $user->barangay_id,
                    'purok_id' => $user->purok_id,
                    'status' => $user->status,
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
                    'created_at' => $n->created_at?->toIso8601String(),
                ])
                : [],
        ];
    }
}
