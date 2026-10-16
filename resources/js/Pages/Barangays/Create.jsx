import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import BarangayFields, { barangayFormData } from './Partials/BarangayFields';

export default function CreateBarangay() {
    const { data, setData, post, processing, errors } = useForm(barangayFormData());

    const submit = (e) => {
        e.preventDefault();
        post('/barangays', { forceFormData: true });
    };

    return (
        <AppLayout description="Create the barangay's profile. Only name, code and LGU are required." header={<h1 className="text-lg font-semibold text-foreground">Add Barangay</h1>}>
            <Head title="Add Barangay" />
            <FormShell width="2xl">
                <form onSubmit={submit} className="space-y-5">
                    <BarangayFields data={data} setData={setData} errors={errors} />
                    <FormActions>
                        <CancelLink href="/barangays" />
                        <PrimaryButton disabled={processing}>{processing ? 'Saving…' : 'Add Barangay'}</PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
