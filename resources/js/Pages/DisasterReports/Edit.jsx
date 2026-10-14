import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import LocationPicker from '@/Components/LocationPicker';
import { usePage } from '@inertiajs/react';

const DISASTER_TYPES = ['Flood', 'Fire', 'Earthquake', 'Landslide', 'Typhoon', 'Drought', 'Storm Surge', 'Other'];
const SEVERITIES = [['low', 'Low'], ['moderate', 'Moderate'], ['high', 'High'], ['critical', 'Critical']];

export default function EditDisasterReport({ report, barangays = [], puroks = [], statuses = [] }) {
    const { auth } = usePage().props;
    const role = auth?.user?.role;
    const canChangeStatus = ['admin', 'super_admin', 'purok_president'].includes(role);

    const { data, setData, patch, processing, errors } = useForm({
        type: report.type ?? '',
        severity: report.severity ?? 'moderate',
        description: report.description ?? '',
        affected_area: report.affected_area ?? '',
        purok_id: report.purok_id ?? '',
        latitude: report.latitude ?? null,
        longitude: report.longitude ?? null,
        status: report.status ?? 'reported',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(`/disaster-reports/${report.id}`);
    };

    return (
        <AppLayout header={<h1 className="text-lg font-semibold text-gray-800">Edit Report #{report.id}</h1>}>
            <Head title="Edit Disaster Report" />

            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="type" value="Disaster Type" />
                                <select id="type" value={data.type} onChange={e => setData('type', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                    {DISASTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <InputError message={errors.type} />
                            </div>

                            <div>
                                <InputLabel htmlFor="severity" value="Severity" />
                                <select id="severity" value={data.severity} onChange={e => setData('severity', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
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
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" />
                            <InputError message={errors.description} />
                        </div>

                        {canChangeStatus && (
                            <div>
                                <InputLabel htmlFor="status" value="Status" />
                                <select id="status" value={data.status} onChange={e => setData('status', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm">
                                    <option value="reported">Reported</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                                <InputError message={errors.status} />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Link href={`/disaster-reports/${report.id}`}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                                Cancel
                            </Link>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Saving…' : 'Save Changes'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
