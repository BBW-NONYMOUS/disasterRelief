<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Relief goods vocabulary
    |--------------------------------------------------------------------------
    |
    | Units and categories accepted for donated goods and inventory. Keeping
    | them fixed is what lets a donation line merge into an existing stock
    | row (same barangay + category + name + unit) instead of duplicating it.
    |
    */

    'units' => ['pack', 'piece', 'kg', 'liter', 'sack', 'box', 'can', 'bottle'],

    'categories' => ['Food', 'Water', 'Medicine', 'Hygiene', 'Clothing', 'Shelter', 'Other'],

    // Inventory at or below this quantity is flagged as low stock.
    'low_stock_threshold' => 10,

];
