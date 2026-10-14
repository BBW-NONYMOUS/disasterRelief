import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import PhotoUpload from '@/Components/PhotoUpload';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import LocationPicker from '@/Components/LocationPicker';

const DISASTER_TYPES = ['Flood', 'Fire', 'Earthquake', 'Landslide', 'Typhoon', 'Drought', 'Storm Surge', 'Other'];
const SEVERITIES = [['low', 'Low'], ['moderate', 'Moderate'], ['high', 'High'], ['critical', 'Critical']];

export default function CreateDisasterReport({ barangays = [], puroks = [] }) {
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

    const submit = (e) => {
        e.preventDefault();
        post('/disaster-reports', { forceFormData: true });
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">File a Disaster Report</h1>}>
            <Head title="New Disaster Report" />

            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="barangay_id" value="Barangay *" />
                                <select
                                    id="barangay_id"
                                    value={data.barangay_id}
                                    onChange={e => setData('barangay_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select barangay</option>
                                    {barangays.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.barangay_id} />
                            </div>

                            <div>
                                <InputLabel htmlFor="purok_id" value="Purok (optional)" />
                                <select
                                    id="purok_id"
                                    value={data.purok_id}
                                    onChange={e => setData('purok_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
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
                                <InputLabel htmlFor="type" value="Disaster Type *" />
                                <select
                                    id="type"
                                    value={data.type}
                                    onChange={e => setData('type', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select type</option>
                                    {DISASTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <InputError message={errors.type} />
                            </div>

                            <div>
                                <InputLabel htmlFor="severity" value="Severity *" />
                                <select
                                    id="severity"
                                    value={data.severity}
                                    onChange={e => setData('severity', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {SEVERITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                                <InputError message={errors.severity} />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="affected_area" value="Affected Area *" />
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
                            <InputLabel value="Pin the location on the map (optional)" />
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
                            <InputLabel htmlFor="description" value="Description *" />
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                rows={4}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Describe the disaster, number of affected families, immediate needs..."
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div>
                            <InputLabel value="Photos (up to 5)" />
                            <div className="mt-1">
                                <PhotoUpload
                                    onChange={files => setData('photos', files)}
                                    error={errors['photos.0'] || errors.photos}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <a href="/disaster-reports"
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                                Cancel
                            </a>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Submitting…' : 'Submit Report'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
