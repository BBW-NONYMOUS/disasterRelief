import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { compressImage } from '@/Components/PhotoUpload';
import TextInput from '@/Components/TextInput';
import { Button } from '@/Components/ui/button';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/** Form state for a barangay; `barangay` is the existing record when editing. */
export function barangayFormData(barangay = {}) {
    return {
        name: barangay.name ?? '',
        code: barangay.code ?? '',
        lgu_name: barangay.lgu_name ?? '',
        description: barangay.description ?? '',
        captain_name: barangay.captain_name ?? '',
        contact_number: barangay.contact_number ?? '',
        email: barangay.email ?? '',
        hall_address: barangay.hall_address ?? '',
        population: barangay.population ?? '',
        land_area_km2: barangay.land_area_km2 ?? '',
        image: null,
        remove_image: false,
    };
}

function Section({ title, description, children }) {
    return (
        <section className="space-y-4 border-t pt-5 first:border-t-0 first:pt-0">
            <div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            {children}
        </section>
    );
}

function Field({ id, label, error, className, children }) {
    return (
        <div className={className}>
            <InputLabel htmlFor={id} value={label} />
            <div className="mt-1">{children}</div>
            <InputError message={error} />
        </div>
    );
}

function CoverPhotoInput({ currentUrl, removed, onSelect, onRemove, error }) {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [compressing, setCompressing] = useState(false);

    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    const shown = preview ?? (removed ? null : currentUrl);

    const choose = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setCompressing(true);
        const compressed = await compressImage(file);
        setCompressing(false);
        setPreview(URL.createObjectURL(compressed));
        onSelect(compressed);
    };

    const remove = () => {
        setPreview(null);
        onRemove();
    };

    return (
        <div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted/40">
                {shown ? (
                    <img src={shown} alt="Barangay photo preview" className="h-full w-full object-cover" />
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-transparent text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60 hover:text-foreground"
                    >
                        <ImagePlus className="h-8 w-8" aria-hidden="true" />
                        <span className="text-sm font-medium">Upload a photo</span>
                        <span className="text-xs">The barangay hall or a landmark · JPG, PNG or WEBP</span>
                    </button>
                )}
                {compressing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm text-foreground" role="status">
                        Preparing photo…
                    </div>
                )}
            </div>

            {shown && (
                <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                        <ImagePlus aria-hidden="true" /> Change photo
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={remove} className="text-destructive hover:text-destructive">
                        <Trash2 aria-hidden="true" /> Remove
                    </Button>
                </div>
            )}

            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} className="hidden" />
            <InputError message={error} />
        </div>
    );
}

export default function BarangayFields({ data, setData, errors, currentImageUrl = null }) {
    const input = (field) => ({
        id: field,
        value: data[field],
        onChange: (e) => setData(field, e.target.value),
        className: 'block w-full',
    });

    return (
        <div className="space-y-5">
            <Section title="Photo" description="Shown on the barangay's profile card.">
                <CoverPhotoInput
                    currentUrl={currentImageUrl}
                    removed={data.remove_image}
                    onSelect={(file) => setData(d => ({ ...d, image: file, remove_image: false }))}
                    onRemove={() => setData(d => ({ ...d, image: null, remove_image: true }))}
                    error={errors.image}
                />
            </Section>

            <Section title="Basic information">
                <Field id="name" label="Barangay Name *" error={errors.name}>
                    <TextInput {...input('name')} placeholder="e.g. Poblacion" />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="code" label="Code *" error={errors.code}>
                        <TextInput {...input('code')} placeholder="PSGC code, e.g. 1206501009" />
                    </Field>
                    <Field id="lgu_name" label="LGU *" error={errors.lgu_name}>
                        <TextInput {...input('lgu_name')} placeholder="e.g. Municipality of Bagumbayan" />
                    </Field>
                </div>
                <Field id="description" label="About" error={errors.description}>
                    <textarea
                        {...input('description')}
                        rows={3}
                        className="block w-full rounded-md border-input text-sm shadow-sm focus:border-primary focus:ring-primary"
                        placeholder="A short introduction: location, landmarks, main livelihood, known hazards…"
                    />
                </Field>
            </Section>

            <Section title="Officials & contact" description="How residents and responders reach the barangay.">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="captain_name" label="Punong Barangay" error={errors.captain_name}>
                        <TextInput {...input('captain_name')} placeholder="Full name" />
                    </Field>
                    <Field id="contact_number" label="Hotline" error={errors.contact_number}>
                        <TextInput {...input('contact_number')} type="tel" placeholder="09XXXXXXXXX" />
                    </Field>
                    <Field id="email" label="Email" error={errors.email}>
                        <TextInput {...input('email')} type="email" placeholder="barangay@example.gov.ph" />
                    </Field>
                    <Field id="hall_address" label="Barangay hall address" error={errors.hall_address}>
                        <TextInput {...input('hall_address')} placeholder="Street, purok" />
                    </Field>
                </div>
            </Section>

            <Section title="Profile figures">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="population" label="Population" error={errors.population}>
                        <TextInput {...input('population')} type="number" min="0" placeholder="e.g. 5965" />
                    </Field>
                    <Field id="land_area_km2" label="Land area (km²)" error={errors.land_area_km2}>
                        <TextInput {...input('land_area_km2')} type="number" min="0" step="0.01" placeholder="e.g. 12.50" />
                    </Field>
                </div>
            </Section>
        </div>
    );
}
