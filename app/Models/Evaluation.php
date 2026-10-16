<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evaluation extends Model
{
    /** ISO 25010-aligned criteria rated on a 1–5 Likert scale. */
    public const CRITERIA = [
        'functionality' => [
            'label' => 'Functionality',
            'statement' => 'The system performs the functions it is expected to do: reporting incidents, requesting assistance, donating, distributing relief and generating reports.',
        ],
        'usability' => [
            'label' => 'Usability',
            'statement' => 'The system is easy to learn and use on both a phone and a computer.',
        ],
        'accuracy' => [
            'label' => 'Accuracy',
            'statement' => 'The information shown (statuses, inventory counts, totals and reports) is correct and up to date.',
        ],
        'reliability' => [
            'label' => 'Reliability',
            'statement' => 'The system works consistently without errors, crashes or lost data.',
        ],
        'security' => [
            'label' => 'Security',
            'statement' => 'My personal data is protected and I can only access what my role permits.',
        ],
    ];

    public const SCALE = [
        5 => 'Strongly Agree',
        4 => 'Agree',
        3 => 'Neutral',
        2 => 'Disagree',
        1 => 'Strongly Disagree',
    ];

    protected $fillable = ['user_id', 'role', 'criterion', 'score', 'comment'];

    protected $casts = [
        'score' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Verbal interpretation of a weighted mean using equal 0.8-wide bands. */
    public static function interpret(?float $mean): ?string
    {
        if ($mean === null) {
            return null;
        }

        return match (true) {
            $mean >= 4.21 => 'Strongly Agree',
            $mean >= 3.41 => 'Agree',
            $mean >= 2.61 => 'Neutral',
            $mean >= 1.81 => 'Disagree',
            default => 'Strongly Disagree',
        };
    }
}
