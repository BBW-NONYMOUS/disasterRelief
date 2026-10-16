<?php

namespace App\Exceptions;

use App\Models\InventoryItem;
use RuntimeException;

class InsufficientStockException extends RuntimeException
{
    public function __construct(public InventoryItem $item, public int $requested)
    {
        parent::__construct(
            "Insufficient stock for {$item->name}: requested {$requested} {$item->unit}, only {$item->quantity} available."
        );
    }
}
