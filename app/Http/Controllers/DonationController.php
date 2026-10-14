<?php

namespace App\Http\Controllers;

use App\Enums\DonationStatus;
use App\Enums\PaymentStatus;
use App\Models\Donation;
use App\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DonationController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = Donation::with('donor');

        if ($user->role->value === 'donor') {
            $query->where('donor_id', $user->id);
        }

        return Inertia::render('Donations/Index', [
            'donations' => $query->latest()->paginate(15),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Donations/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'type' => 'required|in:cash,goods',
            'amount_cents' => 'required_if:type,cash|integer|min:100',
            'items' => 'required_if:type,goods|string',
            'delivery_method' => 'required|in:deliver,pickup',
            'scheduled_at' => 'nullable|date|after:now',
        ]);

        $donation = Donation::create([
            'donor_id' => $request->user()->id,
            'type' => $data['type'],
            'amount_cents' => $data['amount_cents'] ?? 0,
            'items' => $data['items'] ?? null,
            'delivery_method' => $data['delivery_method'],
            'scheduled_at' => $data['scheduled_at'] ?? null,
            'payment_status' => PaymentStatus::Pending,
            'status' => DonationStatus::Pending,
        ]);

        if ($data['type'] === 'cash') {
            $checkoutUrl = $this->paymentService->createCheckout($donation);
            if ($checkoutUrl) {
                return redirect()->away($checkoutUrl);
            }
        }

        return redirect()->route('donations.index')
            ->with('success', 'Donation recorded. Thank you!');
    }

    public function show(Donation $donation): Response
    {
        $this->authorize('view', $donation);

        return Inertia::render('Donations/Show', [
            'donation' => $donation->load('donor'),
        ]);
    }

    public function destroy(Donation $donation): RedirectResponse
    {
        $this->authorize('delete', $donation);
        $donation->delete();

        return redirect()->route('donations.index')->with('success', 'Donation removed.');
    }
}
