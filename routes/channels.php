<?php

use Illuminate\Support\Facades\Broadcast;

// Per-user private channel used by Laravel notification broadcasting
// (BroadcastNotificationCreated). Powers the NotificationBell alarm.
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
