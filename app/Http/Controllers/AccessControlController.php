<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Services\RoleAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** Super Admin: role × module access levels. Routes are restricted to role:super_admin. */
class AccessControlController extends Controller
{
    public function __construct(private RoleAccess $access) {}

    public function index(): Response
    {
        return Inertia::render('AccessControl/Index', [
            'modules' => collect(RoleAccess::MODULES)->map(fn ($label, $key) => [
                'key' => $key,
                'label' => $label,
                'levels' => RoleAccess::levelsAvailableFor($key),
            ])->values(),
            'levels' => collect(RoleAccess::LEVELS)->map(fn ($label, $value) => ['value' => $value, 'label' => $label])->values(),
            'matrix' => $this->access->matrix(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'role' => ['required', Rule::enum(UserRole::class)],
            'module' => ['required', Rule::in(array_keys(RoleAccess::MODULES))],
            'level' => ['required', Rule::in(array_keys(RoleAccess::LEVELS))],
        ]);

        $role = UserRole::from($data['role']);
        $module = $data['module'];

        if ($role === UserRole::SuperAdmin) {
            throw ValidationException::withMessages(['role' => 'The Super Admin always keeps Full Access.']);
        }

        if (! $this->access->isApplicable($role, $module)) {
            throw ValidationException::withMessages(['module' => "{$role->label()} accounts do not use this module."]);
        }

        if (! in_array($data['level'], RoleAccess::levelsAvailableFor($module), true)) {
            throw ValidationException::withMessages(['level' => RoleAccess::MODULES[$module].' cannot be set to '.RoleAccess::LEVELS[$data['level']].'.']);
        }

        $this->access->set($role, $module, $data['level']);

        return back()->with('success', RoleAccess::MODULES[$module]." for {$role->label()}: ".RoleAccess::LEVELS[$data['level']].'.');
    }
}
