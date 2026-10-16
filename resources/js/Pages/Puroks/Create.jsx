import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import PurokFields from './Partials/PurokFields';

export default function CreatePurok({ barangays = [], presidents = [], defaults = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        barangay_id: defaults.barangay_id ?? '',
        name: '',
        president_id: '',
    });

    return (
        <AppLayout description="Add a purok and assign its president." header={<h1 className="text-lg font-semibold text-foreground">Add Purok</h1>}>
            <Head title="Add Purok" />
            <FormShell width="lg">
                <form onSubmit={e => { e.preventDefault(); post('/puroks'); }} className="space-y-5">
                    <PurokFields data={data} setData={setData} errors={errors} barangays={barangays} presidents={presidents} />
                    <FormActions>
                        <CancelLink href="/puroks" />
                        <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Add Purok'}</PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
