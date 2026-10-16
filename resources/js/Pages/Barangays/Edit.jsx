import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import BarangayFields, { barangayFormData } from './Partials/BarangayFields';

export default function EditBarangay({ barangay }) {
    // Files can't travel in a PUT request, so the update is a POST with method spoofing.
    const { data, setData, post, processing, errors } = useForm({ ...barangayFormData(barangay), _method: 'put' });

    const submit = (e) => {
        e.preventDefault();
        post(`/barangays/${barangay.id}`, { forceFormData: true });
    };

    return (
        <AppLayout description="Update the barangay's photo, officials and profile." header={<h1 className="text-lg font-semibold text-foreground">Edit: {barangay.name}</h1>}>
            <Head title={`Edit ${barangay.name}`} />
            <FormShell width="2xl">
                <form onSubmit={submit} className="space-y-5">
                    <BarangayFields data={data} setData={setData} errors={errors} currentImageUrl={barangay.image_url} />
                    <FormActions>
                        <CancelLink href="/barangays" />
                        <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Save Changes'}</PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
