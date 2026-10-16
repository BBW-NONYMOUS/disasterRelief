<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\AssistanceRequest;
use App\Models\DisasterReport;
use App\Models\Distribution;
use App\Models\Donation;
use App\Models\Household;
use App\Models\InventoryItem;
use App\Models\User;
use InvalidArgumentException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Role privilege matrix. Each role has a baseline of modules its routes and
 * policies support; the Super Admin sets an access level per role × module:
 *
 *   Full Access — use the module normally
 *   View Only   — open its pages, but no create/edit/approve/delete
 *   No Access   — module hidden and blocked
 *
 * Stored as Spatie permissions on the role: "{module}" grants viewing and
 * "{module}.manage" grants changes.
 */
class RoleAccess
{
    public const FULL = 'full';
    public const VIEW = 'view';
    public const NONE = 'none';

    public const LEVELS = [
        self::FULL => 'Full Access',
        self::VIEW => 'View Only',
        self::NONE => 'No Access',
    ];

    public const MODULES = [
        'disaster_reports' => 'Disaster Reports',
        'assistance_requests' => 'Assistance Requests',
        'donations' => 'Donations',
        'households' => 'Households',
        'distributions' => 'Distributions',
        'inventory' => 'Inventory',
        'reports' => 'PDF Reports',
        'users' => 'User Management',
        'evaluations' => 'System Evaluation',
    ];

    /** A survey form has nothing to "view" without submitting. */
    public const WITHOUT_VIEW_ONLY = ['evaluations'];

    /** The most a role can ever have; the matrix can only take away from this. */
    public const BASELINE = [
        'admin' => ['disaster_reports', 'assistance_requests', 'donations', 'households', 'distributions', 'inventory', 'reports', 'users', 'evaluations'],
        'purok_president' => ['disaster_reports', 'assistance_requests', 'households', 'distributions', 'evaluations'],
        'resident' => ['disaster_reports', 'assistance_requests', 'evaluations'],
        'donor' => ['disaster_reports', 'assistance_requests', 'donations', 'evaluations'],
    ];

    /** Which module a policy subject (model or class name) belongs to. */
    private const SUBJECT_MODULES = [
        DisasterReport::class => 'disaster_reports',
        AssistanceRequest::class => 'assistance_requests',
        Donation::class => 'donations',
        Household::class => 'households',
        Distribution::class => 'distributions',
        InventoryItem::class => 'inventory',
        User::class => 'users',
    ];

    /** @var array<string, array<string, string>> per-request cache of role => [module => level] */
    private array $levels = [];

    /** @return array<string, string> module => level for every module */
    public function levelsFor(?UserRole $role): array
    {
        if ($role === null) {
            return array_fill_keys(array_keys(self::MODULES), self::NONE);
        }

        // The Super Admin is never restricted, so access control can't lock itself out.
        if ($role === UserRole::SuperAdmin) {
            return array_fill_keys(array_keys(self::MODULES), self::FULL);
        }

        return $this->levels[$role->value] ??= $this->loadLevels($role);
    }

    public function levelFor(?UserRole $role, string $module): string
    {
        return $this->levelsFor($role)[$module] ?? self::NONE;
    }

    /** @return array<int, string> modules the role can open (View Only or Full Access) */
    public function modulesFor(?UserRole $role): array
    {
        return array_keys(array_filter($this->levelsFor($role), fn ($level) => $level !== self::NONE));
    }

    public function allows(?UserRole $role, string $module): bool
    {
        return $this->levelFor($role, $module) !== self::NONE;
    }

    public function canManage(?UserRole $role, string $module): bool
    {
        return $this->levelFor($role, $module) === self::FULL;
    }

    public function isApplicable(UserRole $role, string $module): bool
    {
        return in_array($module, self::BASELINE[$role->value] ?? [], true);
    }

    /** @return array<int, string> levels the matrix offers for this module */
    public static function levelsAvailableFor(string $module): array
    {
        return in_array($module, self::WITHOUT_VIEW_ONLY, true)
            ? [self::FULL, self::NONE]
            : [self::FULL, self::VIEW, self::NONE];
    }

    public static function moduleForSubject(mixed $subject): ?string
    {
        $class = is_object($subject) ? $subject::class : (is_string($subject) ? $subject : null);

        return $class ? (self::SUBJECT_MODULES[$class] ?? null) : null;
    }

    public function set(UserRole $role, string $module, string $level): void
    {
        if ($role === UserRole::SuperAdmin || ! $this->isApplicable($role, $module)) {
            throw new InvalidArgumentException("{$role->label()} has no {$module} module to change.");
        }

        if (! in_array($level, self::levelsAvailableFor($module), true)) {
            throw new InvalidArgumentException("{$level} is not available for {$module}.");
        }

        $roleModel = Role::findOrCreate($role->value, 'web');
        $view = Permission::findOrCreate($module, 'web');
        $manage = Permission::findOrCreate("{$module}.manage", 'web');

        $was = $this->levelFor($role, $module);

        match ($level) {
            self::FULL => $roleModel->givePermissionTo([$view, $manage]),
            self::VIEW => $roleModel->givePermissionTo($view)->revokePermissionTo($manage),
            self::NONE => $roleModel->revokePermissionTo($view)->revokePermissionTo($manage),
        };
        unset($this->levels[$role->value]);

        if ($was !== $level) {
            ActivityLog::create([
                'event' => 'access_changed',
                'subject_type' => $roleModel->getMorphClass(),
                'subject_id' => $roleModel->id,
                'causer_id' => auth()->id(),
                'properties' => [
                    'old' => ['role' => $role->value, 'module' => $module, 'access' => self::LEVELS[$was]],
                    'attributes' => ['role' => $role->value, 'module' => $module, 'access' => self::LEVELS[$level]],
                ],
            ]);
        }
    }

    /** Rows for the Access Control screen: every role × every module. */
    public function matrix(): array
    {
        return array_map(fn (UserRole $role) => [
            'role' => $role->value,
            'label' => $role->label(),
            'locked' => $role === UserRole::SuperAdmin,
            'modules' => collect(self::MODULES)->mapWithKeys(fn ($label, $module) => [
                $module => [
                    'applicable' => $role === UserRole::SuperAdmin || $this->isApplicable($role, $module),
                    'level' => $this->levelFor($role, $module),
                ],
            ])->all(),
        ], UserRole::cases());
    }

    private function loadLevels(UserRole $role): array
    {
        $granted = Role::where('name', $role->value)->where('guard_name', 'web')->first()
            ?->permissions()->pluck('name')->all() ?? [];

        $levels = [];
        foreach (array_keys(self::MODULES) as $module) {
            $levels[$module] = match (true) {
                ! $this->isApplicable($role, $module), ! in_array($module, $granted, true) => self::NONE,
                in_array("{$module}.manage", $granted, true) => self::FULL,
                default => self::VIEW,
            };
        }

        return $levels;
    }
}
