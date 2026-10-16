import AppLayout from '@/Layouts/AppLayout';
import CancelLink from '@/Components/CancelLink';
import { FormActions, FormShell } from '@/Components/FormLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { queueDraft } from '@/lib/offlineQueue';
import { useTranslation } from '@/lib/i18n';
import PhotoUpload from '@/Components/PhotoUpload';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import LocationPicker from '@/Components/LocationPicker';

const DISASTER_TYPES = ['Flood', 'Fire', 'Earthquake', 'Landslide', 'Typhoon', 'Drought', 'Storm Surge', 'Other'];
const SEVERITIES = [['low', 'Low'], ['moderate', 'Moderate'], ['high', 'High'], ['critical', 'Critical']];

export default function CreateDisasterReport({ barangays = [], puroks = [] }) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        barangay_id: '',
        purok_id: '',
        type: '',
        severity: 'moderate',
        description: '',
        affected_area: '',
        latitude: null,
        longitude: null,
        photos: [],
    });

    const [savedOffline, setSavedOffline] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        // relief.md: field reports during typhoons happen with no signal —
        // queue the draft locally and sync when back online.
        if (!navigator.onLine) {
            queueDraft(data);
            setSavedOffline(true);
            return;
        }

        post('/disaster-reports', {
            forceFormData: true,
            onError: () => {
                if (!navigator.onLine) {
                    queueDraft(data);
                    setSavedOffline(true);
                }
            },
        });
    };

    if (savedOffline) {
        return (
            <AppLayout description="Your report is stored on this device." header={<h1 className="text-lg font-semibold text-foreground">{t('File a Disaster Report')}</h1>}>
                <Head title="Report Saved Offline" />
                <FormShell width="2xl" className="space-y-3 text-center">
                    <h2 className="text-lg font-semibold text-foreground">No signal — your report is saved</h2>
                    <p className="text-sm text-muted-foreground">
                        It will send automatically when you are back online. Photos are not kept in the
                        offline queue; you can attach them by editing the report after it sends.
                    </p>
                    <Link href="/dashboard" className="inline-block mt-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-primary/90">
                        Back to Dashboard
                    </Link>
                </FormShell>
            </AppLayout>
        );
    }

    return (
        <AppLayout description="Report an incident in your area. Barangay officials are notified right away." header={<h1 className="text-lg font-semibold text-foreground">{t('File a Disaster Report')}</h1>}>
            <Head title="New Disaster Report" />

            <FormShell width="2xl">
                <form onSubmit={submit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="barangay_id" value={t('Barangay *')} />
                            <select
                                id="barangay_id"
                                value={data.barangay_id}
                                onChange={e => setData('barangay_id', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary"
                            >
                                <option value="">Select barangay</option>
                                {barangays.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.barangay_id} />
                        </div>

                        <div>
                            <InputLabel htmlFor="purok_id" value={t('Purok (optional)')} />
                            <select
                                id="purok_id"
                                value={data.purok_id}
                                onChange={e => setData('purok_id', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary"
                            >
                                <option value="">Select purok</option>
                                {puroks.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.purok_id} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="type" value={t('Disaster Type *')} />
                            <select
                                id="type"
                                value={data.type}
                                onChange={e => setData('type', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary"
                            >
                                <option value="">Select type</option>
                                {DISASTER_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                            </select>
                            <InputError message={errors.type} />
                        </div>

                        <div>
                            <InputLabel htmlFor="severity" value={t('Severity *')} />
                            <select
                                id="severity"
                                value={data.severity}
                                onChange={e => setData('severity', e.target.value)}
                                className="mt-1 block w-full border-input rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary"
                            >
                                {SEVERITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                            <InputError message={errors.severity} />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="affected_area" value={t('Affected Area *')} />
                        <TextInput
                            id="affected_area"
                            value={data.affected_area}
                            onChange={e => setData('affected_area', e.target.value)}
                            className="mt-1 block w-full"
                            placeholder="e.g. Purok 3, near the river"
                        />
                        <InputError message={errors.affected_area} />
                    </div>

                    <div>
                        <InputLabel value={t('Pin the location on the map (optional)')} />
                        <div className="mt-1">
                            <LocationPicker
                                latitude={data.latitude}
                                longitude={data.longitude}
                                onChange={({ latitude, longitude }) => {
                                    setData(d => ({ ...d, latitude, longitude }));
                                }}
                            />
                        </div>
                        <InputError message={errors.latitude || errors.longitude} />
                    </div>

                    <div>
                        <InputLabel htmlFor="description" value={t('Description *')} />
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            rows={4}
                            className="mt-1 block w-full border-input rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary"
                            placeholder="Describe the disaster, number of affected families, immediate needs..."
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div>
                        <InputLabel value={t('Photos (up to 5)')} />
                        <div className="mt-1">
                            <PhotoUpload
                                onChange={files => setData('photos', files)}
                                error={errors['photos.0'] || errors.photos}
                            />
                        </div>
                    </div>

                    <FormActions>
                        <CancelLink href="/disaster-reports" />
                        <PrimaryButton disabled={processing}>
                            {processing ? t('Submitting…') : t('Submit Report')}
                        </PrimaryButton>
                    </FormActions>
                </form>
            </FormShell>
        </AppLayout>
    );
}
