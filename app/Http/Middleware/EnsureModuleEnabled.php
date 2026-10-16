<?php

namespace App\Http\Middleware;

use App\Services\RoleAccess;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Applies the role's Access Control level for a module:
 * No Access blocks everything; View Only blocks forms and any write request.
 */
class EnsureModuleEnabled
{
    public function __construct(private RoleAccess $access) {}

    public function handle(Request $request, Closure $next, string $module): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        $label = RoleAccess::MODULES[$module] ?? $module;
        $level = $this->access->levelFor($user->role, $module);

        if ($level === RoleAccess::NONE) {
            abort(403, "Access to {$label} is restricted for your role.");
        }

        if ($level === RoleAccess::VIEW && $this->changesData($request)) {
            abort(403, "You have view-only access to {$label}.");
        }

        return $next($request);
    }

    private function changesData(Request $request): bool
    {
        if (! $request->isMethodSafe()) {
            return true;
        }

        // Create/edit forms are only useful to someone who can submit them.
        $name = (string) $request->route()?->getName();

        return Str::endsWith($name, ['.create', '.edit']);
    }
}
