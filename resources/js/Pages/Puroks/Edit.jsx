import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import PurokFields from './Partials/PurokFields';

export default function EditPurok({ purok, barangays = [], presidents = [] }) {
    const { data, setData, patch, processing, errors } = useForm({
        barangay_id: purok.barangay_id,
        name: purok.name,
        president_id: purok.president_id ?? '',
    });

    return (
        <AppLayout description="Update the purok's details or president." header={<h1 className="text-lg font-semibold text-foreground">Edit: {purok.name}</h1>}>
            <Head title={`Edit ${purok.name}`} />
            <FormShell width="lg">
                <form onSubmit={e => { e.preventDefault(); patch(`/puroks/${purok.id}`); }} className="space-y-5">
                    <PurokFields data={data} setData={setData} errors={errors} barangays={barangays} presidents={presidents} />
                    <FormActions>
                        <CancelLink href={`/puroks?barangay_id=${purok.barangay_id}`} />
                        <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save Changes'}</PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
