<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\Barangay;
use App\Models\Purok;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = User::with(['barangay', 'purok']);

        if ($user->role === UserRole::Admin) {
            $query->where('barangay_id', $user->barangay_id);
        }

        return Inertia::render('Users/Index', [
            'users' => $query->paginate(20),
            'roles' => UserRole::cases(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Users/Create', [
            'roles' => UserRole::cases(),
            'barangays' => Barangay::all(['id', 'name']),
            'puroks' => Purok::all(['id', 'name', 'barangay_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role' => 'required|in:super_admin,admin,purok_president,resident,donor',
            'phone' => 'nullable|string|max:20',
            'barangay_id' => 'nullable|exists:barangays,id',
            'purok_id' => 'nullable|exists:puroks,id',
        ]);

        $role = UserRole::from($data['role']);
        $user = User::create([
            ...$data,
            'password' => Hash::make($data['password']),
            'role' => $role,
            'status' => 'active',
        ]);
        $user->assignRole($role->value);

        return redirect()->route('users.index')->with('success', 'User created.');
    }

    public function show(User $user): Response
    {
        return Inertia::render('Users/Show', [
            'userRecord' => $user->load(['barangay', 'purok']),
        ]);
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Users/Edit', [
            'userRecord' => $user->load(['barangay', 'purok']),
            'roles' => UserRole::cases(),
            'barangays' => Barangay::all(['id', 'name']),
            'puroks' => Purok::all(['id', 'name', 'barangay_id']),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:super_admin,admin,purok_president,resident,donor',
            'phone' => 'nullable|string|max:20',
            'barangay_id' => 'nullable|exists:barangays,id',
            'purok_id' => 'nullable|exists:puroks,id',
            'status' => 'sometimes|in:active,inactive',
        ]);

        if (isset($data['role'])) {
            $newRole = UserRole::from($data['role']);
            $user->syncRoles([$newRole->value]);
            $data['role'] = $newRole;
        }

        $user->update($data);

        return redirect()->route('users.index')->with('success', 'User updated.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->update(['status' => 'inactive']);
        return redirect()->route('users.index')->with('success', 'User deactivated.');
    }
}
