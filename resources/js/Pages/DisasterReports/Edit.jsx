import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import LocationPicker from '@/Components/LocationPicker';

const DISASTER_TYPES = ['Flood', 'Fire', 'Earthquake', 'Landslide', 'Typhoon', 'Drought', 'Storm Surge', 'Other'];
const SEVERITIES = [['low', 'Low'], ['moderate', 'Moderate'], ['high', 'High'], ['critical', 'Critical']];

export default function EditDisasterReport({ report, barangays = [], puroks = [] }) {
    const { data, setData, patch, processing, errors } = useForm({
        type: report.type ?? '',
        severity: report.severity ?? 'moderate',
        description: report.description ?? '',
        affected_area: report.affected_area ?? '',
        purok_id: report.purok_id ?? '',
        latitude: report.latitude ?? null,
        longitude: report.longitude ?? null,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(`/disaster-reports/${report.id}`);
    };

    return (
        <AppLayout description="Correct the details of this report." header={<h1 className="text-lg font-semibold text-foreground">Edit Report #{report.id}</h1>}>
            <Head title="Edit Disaster Report" />

            <FormShell width="2xl">
                <form onSubmit={submit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="type" value="Disaster Type" />
                            <select id="type" value={data.type} onChange={e => setData('type', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                {DISASTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <InputError message={errors.type} />
                        </div>

                        <div>
                            <InputLabel htmlFor="severity" value="Severity" />
                            <select id="severity" value={data.severity} onChange={e => setData('severity', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                {SEVERITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                            <InputError message={errors.severity} />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="affected_area" value="Affected Area" />
                        <TextInput id="affected_area" value={data.affected_area}
                            onChange={e => setData('affected_area', e.target.value)} className="mt-1 block w-full" />
                        <InputError message={errors.affected_area} />
                    </div>

                    <div>
                        <InputLabel value="Location on map" />
                        <div className="mt-1">
                            <LocationPicker
                                latitude={data.latitude}
                                longitude={data.longitude}
                                onChange={({ latitude, longitude }) => setData(d => ({ ...d, latitude, longitude }))}
                            />
                        </div>
                        <InputError message={errors.latitude || errors.longitude} />
                    </div>

                    <div>
                        <InputLabel htmlFor="description" value="Description" />
                        <textarea id="description" value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            rows={4}
                            className="mt-1 block w-full border-input rounded-md shadow-sm text-sm" />
                        <InputError message={errors.description} />
                    </div>

                    {puroks.length > 0 && (
                        <div>
                            <InputLabel htmlFor="purok_id" value="Purok" />
                            <select id="purok_id" value={data.purok_id ?? ''} onChange={e => setData('purok_id', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm">
                                <option value="">Not specified</option>
                                {puroks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <InputError message={errors.purok_id} />
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">Status changes (verify, confirm, resolve, reject) are made from the report page so each step is recorded in the timeline.</p>

                    <FormActions>
                        <CancelLink href={`/disaster-reports/${report.id}`} />
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Saving…' : 'Save Changes'}
                        </PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
