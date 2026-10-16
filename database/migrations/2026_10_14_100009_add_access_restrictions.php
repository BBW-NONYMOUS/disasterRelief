<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Module access each role has today. "{module}" grants viewing and
     * "{module}.manage" grants changes, so seeding both means every role
     * starts at Full Access; the Super Admin then lowers levels per role
     * (View Only / No Access) from Access Control.
     */
    private const BASELINE = [
        'admin' => ['disaster_reports', 'assistance_requests', 'donations', 'households', 'distributions', 'inventory', 'reports', 'users', 'evaluations'],
        'purok_president' => ['disaster_reports', 'assistance_requests', 'households', 'distributions', 'evaluations'],
        'resident' => ['disaster_reports', 'assistance_requests', 'evaluations'],
        'donor' => ['disaster_reports', 'assistance_requests', 'donations', 'evaluations'],
    ];

    public function up(): void
    {
        // Account suspension ("restrict access") by the Super Admin.
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('suspended_at')->nullable()->after('status');
            $table->foreignId('suspended_by')->nullable()->after('suspended_at')->constrained('users')->nullOnDelete();
            $table->string('suspension_reason', 500)->nullable()->after('suspended_by');
        });

        foreach (['super_admin', ...array_keys(self::BASELINE)] as $name) {
            Role::findOrCreate($name, 'web');
        }

        foreach ($this->permissionNames() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (self::BASELINE as $role => $modules) {
            Role::findByName($role, 'web')->givePermissionTo(
                array_merge($modules, array_map(fn ($m) => "{$m}.manage", $modules)),
            );
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::whereIn('name', $this->permissionNames())->where('guard_name', 'web')->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('suspended_by');
            $table->dropColumn(['suspended_at', 'suspension_reason']);
        });
    }

    private function permissionNames(): array
    {
        $modules = array_unique(array_merge(...array_values(self::BASELINE)));

        return array_merge($modules, array_map(fn ($m) => "{$m}.manage", $modules));
    }
};
