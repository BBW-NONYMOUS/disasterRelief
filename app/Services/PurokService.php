<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\Purok;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Keeps puroks.president_id and the president's users.purok_id pointing at
 * each other. Report and household scoping uses users.purok_id, so the two
 * must never drift apart.
 */
class PurokService
{
    public function assignPresident(Purok $purok, ?User $president): void
    {
        DB::transaction(function () use ($purok, $president) {
            if ($president) {
                // A user leads at most one purok.
                Purok::where('president_id', $president->id)
                    ->whereKeyNot($purok->id)
                    ->update(['president_id' => null]);

                $president->update([
                    'purok_id' => $purok->id,
                    'barangay_id' => $purok->barangay_id,
                ]);
            }

            $purok->update(['president_id' => $president?->id]);
        });
    }

    /** Call after a user's role, purok or status changes in account management. */
    public function syncFromUser(User $user): void
    {
        $leads = $user->role === UserRole::PurokPresident && $user->purok_id && $user->isActive();

        Purok::where('president_id', $user->id)
            ->when($leads, fn ($q) => $q->whereKeyNot($user->purok_id))
            ->update(['president_id' => null]);

        if ($leads) {
            Purok::whereKey($user->purok_id)
                ->whereNull('president_id')
                ->update(['president_id' => $user->id]);
        }
    }
}
