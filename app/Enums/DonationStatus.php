<?php

namespace App\Enums;

enum DonationStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Delivered = 'delivered';
    case Distributed = 'distributed';
}
