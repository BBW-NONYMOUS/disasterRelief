import InlineSelect from '@/Components/InlineSelect';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function PurokFields({ data, setData, errors, barangays, presidents }) {
    // Unassigned presidents, or ones already in this barangay.
    const candidates = presidents.filter(p => !p.barangay_id || String(p.barangay_id) === String(data.barangay_id));

    return (
        <>
            <div>
                <InputLabel htmlFor="barangay_id" value="Barangay *" />
                <InlineSelect id="barangay_id" value={data.barangay_id} placeholder="Select barangay"
                    onChange={v => setData(d => ({ ...d, barangay_id: v, president_id: '' }))}
                    options={barangays.map(b => ({ value: b.id, label: b.name }))} />
                <InputError message={errors.barangay_id} />
            </div>
            <div>
                <InputLabel htmlFor="name" value="Purok Name *" />
                <TextInput id="name" value={data.name} onChange={e => setData('name', e.target.value)}
                    className="mt-1 block w-full" placeholder="e.g. Purok 3 / Sampaguita" />
                <InputError message={errors.name} />
            </div>
            <div>
                <InputLabel htmlFor="president_id" value="Purok President" />
                <InlineSelect id="president_id" value={data.president_id} placeholder="— None —"
                    onChange={v => setData('president_id', v)} disabled={!data.barangay_id}
                    options={candidates.map(p => ({ value: p.id, label: `${p.name} (${p.email})` }))} />
                <p className="text-xs text-muted-foreground mt-1">
                    Lists active Purok President accounts. Assigning one moves their account to this purok;
                    create the account first under Users if it is not listed.
                </p>
                <InputError message={errors.president_id} />
            </div>
        </>
    );
}
