export default function VerifiedBadge({ household }) {
    if (!household.verified_at) {
        return <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Unverified</span>;
    }
    const by = household.verifier ? ` by ${household.verifier.name}` : '';
    return (
        <span className="text-xs bg-green-100 text-status-completed px-2 py-0.5 rounded-full font-medium"
            title={`Verified ${new Date(household.verified_at).toLocaleDateString()}${by}`}>
            ✓ Verified
        </span>
    );
}

export const HOUSEHOLD_STATUS_LABELS = { waiting: 'Assistance waiting', ongoing: 'Ongoing', completed: 'Assistance completed' };
