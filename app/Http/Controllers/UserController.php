<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Barangay;
use App\Models\Purok;
use App\Models\User;
use App\Services\PurokService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(private PurokService $puroks) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $user = $request->user();
        $scope = User::query()->when($user->role === UserRole::Admin, fn ($q) => $q
            ->where('barangay_id', $user->barangay_id)
            ->where('role', '!=', UserRole::SuperAdmin->value));

        $role = UserRole::tryFrom((string) $request->query('role'));
        $restricted = $request->query('access') === 'restricted';

        $users = (clone $scope)->with(['barangay', 'purok', 'suspender:id,name'])
            ->when($role, fn ($q) => $q->where('role', $role->value))
            ->when($restricted, fn ($q) => $q->where('status', '!=', 'active'))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        $counts = (clone $scope)->selectRaw('role, count(*) as n')->groupBy('role')->pluck('n', 'role');

        return Inertia::render('Users/Index', [
            'users' => $users,
            // All 5 roles with how many accounts each has, for the role tabs.
            'roles' => collect(UserRole::cases())->map(fn (UserRole $r) => [
                'value' => $r->value,
                'label' => $r->label(),
                'count' => (int) ($counts[$r->value] ?? 0),
            ])->when($user->role === UserRole::Admin, fn ($c) => $c->reject(fn ($r) => $r['value'] === UserRole::SuperAdmin->value))->values(),
            'restricted_count' => (clone $scope)->where('status', '!=', 'active')->count(),
            'filters' => ['role' => $role?->value, 'access' => $restricted ? 'restricted' : null],
            'can_restrict' => $user->role === UserRole::SuperAdmin,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('Users/Create', $this->formOptions($request->user()));
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $actor = $request->user();
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role' => ['required', Rule::in($this->assignableValues($actor))],
            'phone' => 'nullable|string|max:20',
            'barangay_id' => 'nullable|exists:barangays,id',
            'purok_id' => 'nullable|exists:puroks,id',
        ], [
            'role.in' => 'You are not allowed to assign that role.',
        ]);

        $data = $this->scopeLocation($actor, $data);
        $role = UserRole::from($data['role']);

        DB::transaction(function () use ($data, $role) {
            $user = User::create([
                ...$data,
                'password' => Hash::make($data['password']),
                'role' => $role,
                'status' => 'active',
            ]);
            $user->assignRole($role->value);
            $this->puroks->syncFromUser($user);
        });

        return redirect()->route('users.index')->with('success', 'User created.');
    }

    public function show(Request $request, User $user): Response
    {
        $this->authorize('view', $user);

        return Inertia::render('Users/Show', [
            'userRecord' => $user->load(['barangay', 'purok', 'suspender:id,name']),
            'can_restrict' => $request->user()->can('restrict', $user),
        ]);
    }

    public function edit(Request $request, User $user): Response
    {
        $this->authorize('update', $user);

        return Inertia::render('Users/Edit', [
            'userRecord' => $user->load(['barangay', 'purok', 'suspender:id,name']),
            'is_self' => $request->user()->is($user),
        ] + $this->formOptions($request->user()));
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $actor = $request->user();
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,'.$user->id,
            'role' => 'sometimes|in:super_admin,admin,purok_president,resident,donor',
            'phone' => 'nullable|string|max:20',
            'barangay_id' => 'nullable|exists:barangays,id',
            'purok_id' => 'nullable|exists:puroks,id',
            // Access status changes only through restrict/restore (Super Admin).
        ]);

        if (isset($data['role']) && $data['role'] !== $user->role->value) {
            if ($actor->is($user)) {
                throw ValidationException::withMessages(['role' => 'You cannot change your own role.']);
            }
            if (! in_array($data['role'], $this->assignableValues($actor), true)) {
                throw ValidationException::withMessages(['role' => 'You are not allowed to assign that role.']);
            }
        }

        $data = $this->scopeLocation($actor, $data, $user);

        DB::transaction(function () use ($user, $data) {
            if (isset($data['role'])) {
                $newRole = UserRole::from($data['role']);
                $user->syncRoles([$newRole->value]);
                $data['role'] = $newRole;
            }

            $user->update($data);
            $this->puroks->syncFromUser($user);
        });

        return redirect()->route('users.index')->with('success', 'User updated.');
    }

    /** Super Admin: block the account from logging in and end its open sessions. */
    public function restrict(Request $request, User $user): RedirectResponse
    {
        $this->authorize('restrict', $user);

        $data = $request->validate(
            ['reason' => 'required|string|max:500'],
            ['reason.required' => 'Give a reason for restricting this account.'],
        );

        DB::transaction(function () use ($user, $data, $request) {
            $user->forceFill([
                'status' => 'inactive',
                'suspended_at' => now(),
                'suspended_by' => $request->user()->id,
                'suspension_reason' => $data['reason'],
                // Invalidates any "remember me" cookie.
                'remember_token' => Str::random(60),
            ])->save();

            $this->puroks->syncFromUser($user);
        });

        if (config('session.driver') === 'database') {
            DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
        }

        return back()->with('success', "{$user->name}'s access has been restricted.");
    }

    public function restoreAccess(User $user): RedirectResponse
    {
        $this->authorize('restrict', $user);

        DB::transaction(function () use ($user) {
            $user->forceFill([
                'status' => 'active',
                'suspended_at' => null,
                'suspended_by' => null,
                'suspension_reason' => null,
            ])->save();

            $this->puroks->syncFromUser($user);
        });

        return back()->with('success', "{$user->name}'s access has been restored.");
    }

    /** Admins can only place accounts in their own barangay; the purok must belong to it. */
    private function scopeLocation(User $actor, array $data, ?User $target = null): array
    {
        if ($actor->role === UserRole::Admin && ! $actor->is($target)) {
            $data['barangay_id'] = $actor->barangay_id;
        } elseif ($actor->role === UserRole::Admin) {
            unset($data['barangay_id']); // admins cannot move themselves to another barangay
        }

        $barangayId = $data['barangay_id'] ?? $target?->barangay_id;
        if (! empty($data['purok_id']) && ! Purok::whereKey($data['purok_id'])->where('barangay_id', $barangayId)->exists()) {
            throw ValidationException::withMessages(['purok_id' => 'The purok must belong to the selected barangay.']);
        }

        return $data;
    }

    private function assignableValues(User $actor): array
    {
        return array_map(fn (UserRole $r) => $r->value, UserRole::assignableBy($actor->role));
    }

    private function formOptions(User $actor): array
    {
        $barangays = $actor->role === UserRole::SuperAdmin
            ? Barangay::orderBy('name')->get(['id', 'name'])
            : Barangay::whereKey($actor->barangay_id)->get(['id', 'name']);

        return [
            'roles' => UserRole::options(UserRole::assignableBy($actor->role)),
            'barangays' => $barangays,
            'puroks' => Purok::whereIn('barangay_id', $barangays->pluck('id'))->orderBy('name')->get(['id', 'name', 'barangay_id']),
        ];
    }
}
